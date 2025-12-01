import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서만 사용 가능합니다');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // 초기 로드: 토큰이 있으면 사용자 정보 조회
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (err) {
          // 토큰 유효하지 않음 - 조용히 삭제
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [API_BASE_URL]);

  // Step 1: 이메일로 인증 코드 발송
  const register = async (email, name, name_en, position, phone, password, confirmPassword) => {
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
      });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || '인증 코드 발송에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Step 2: 회원가입 완료 (인증된 이메일 + 회원정보)
  const completeRegistration = async ({ email, name, name_en, position, phone, password }) => {
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-email`, {
        email,
        code: '0', // 백엔드에서 이미 검증됨
        name,
        name_en,
        position,
        phone,
        password,
      });

      // 응답에 토큰이 있으면 자동 로그인
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
      }

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || '회원가입 완료에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // 이메일 검증
  const verifyEmail = async (email, code, name, name_en, position, phone, password) => {
    setError(null);
    try {
      const payload = {
        email,
        code,
      };

      // 회원가입 완료 데이터가 있으면 포함
      if (name && phone && password) {
        payload.name = name;
        payload.name_en = name_en;
        payload.position = position;
        payload.phone = phone;
        payload.password = password;
      }

      const response = await axios.post(`${API_BASE_URL}/auth/verify-email`, payload);

      // 회원가입 완료 시 토큰이 있으면 자동 로그인
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        setUser(response.data.user);
        setIsAuthenticated(true);
      }

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || '이메일 검증에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // 로그인
  const login = async (email, password) => {
    setError(null);
    try {
      console.log('로그인 시도:', email);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      console.log('로그인 응답:', response.data);
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('토큰 또는 사용자 정보가 없습니다');
      }

      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      console.log('로그인 성공, 토큰 저장 완료');
      return response.data;
    } catch (err) {
      console.error('로그인 에러:', err);
      const errorMessage = err.response?.data?.message || '로그인에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(
          `${API_BASE_URL}/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (err) {
      console.error('로그아웃 요청 실패:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    register,
    verifyEmail,
    completeRegistration,
    login,
    logout,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
