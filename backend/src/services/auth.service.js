const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('./email.service');
const { validateEmail } = require('../middlewares/validation.middleware');

// MongoDB 사용
const UserModel = require('../models/user.mongodb.js');
const EmailVerificationModel = require('../models/emailVerification.mongodb.js');
const { getDatabase } = require('../config/mongodb');

const generateVerificationCode = () => {
  return Math.random().toString().slice(2, 8);
};

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

const register = async ({ email, name, phone, password }) => {
  try {
    // 이메일 유효성 검증
    if (!validateEmail(email)) {
      throw new Error('유효하지 않은 이메일 형식입니다');
    }

    // @smatch.kr 도메인 검증
    if (!email.endsWith('@smatch.kr')) {
      throw new Error('회원가입은 @smatch.kr 도메인만 가능합니다');
    }

    // MongoDB에서 이메일 중복 확인
    const existingUser = await UserModel.findByEmail(email);

    if (existingUser) {
      throw new Error('이미 가입된 이메일입니다');
    }

    // 인증 코드 생성
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분

    // 기존 인증 코드 삭제
    await EmailVerificationModel.deleteByEmail(email);

    // MongoDB에 인증 코드 저장
    await EmailVerificationModel.create({
      email,
      code,
      expires_at: expiresAt,
    });

    // 인증 이메일 발송
    await emailService.sendVerificationEmail(email, code);

    return {
      message: '인증 코드가 이메일로 발송되었습니다',
      email
    };
  } catch (error) {
    console.error('❌ Register error:', error);
    throw error;
  }
};

const verifyEmail = async (email, code) => {
  try {
    // MongoDB에서 인증 코드 확인
    const verification = await EmailVerificationModel.findByEmailAndCode(email, code);

    if (!verification) {
      throw new Error('인증 코드가 일치하지 않습니다');
    }

    // 만료 시간 확인
    if (new Date() > verification.expires_at) {
      await EmailVerificationModel.deleteByEmail(email);
      throw new Error('인증 코드가 만료되었습니다');
    }

    // 인증 완료 표시
    await EmailVerificationModel.updateById(verification._id.toString(), {
      verified: true,
    });

    return {
      message: '이메일 인증이 완료되었습니다',
      email
    };
  } catch (error) {
    console.error('❌ Email verification error:', error);
    throw error;
  }
};

const completeRegistration = async ({ email, name, name_en, position, phone, password }) => {
  try {
    // MongoDB에서 인증 완료 여부 확인
    const verification = await EmailVerificationModel.findByEmail(email);

    if (!verification || !verification.verified) {
      throw new Error('이메일 인증이 완료되지 않았습니다');
    }

    // MongoDB에서 이미 가입된 사용자 확인
    const existingUser = await UserModel.findByEmail(email);

    if (existingUser) {
      throw new Error('이미 가입된 이메일입니다');
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));

    // is_smatch_domain 설정
    const isSmatchDomain = email.endsWith('@smatch.kr');

    // MongoDB에 사용자 생성
    const user = await UserModel.create({
      email,
      name,
      name_en,
      position,
      phone,
      password_hash: passwordHash,
      email_verified: true,
      is_smatch_domain: isSmatchDomain,
      role: 'user',
      status: 'active'
    });

    // 인증 코드 삭제
    await EmailVerificationModel.deleteByEmail(email);

    // 토큰 생성
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    return {
      success: true,
      message: '회원가입이 완료되었습니다',
      token,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        name_en: user.name_en,
        position: user.position,
        phone: user.phone,
        role: user.role
      }
    };
  } catch (error) {
    console.error('❌ Registration completion error:', error);
    throw error;
  }
};

const login = async (email, password) => {
  try {
    // MongoDB에서 사용자 조회
    const user = await UserModel.findByEmail(email);

    if (!user) {
      throw new Error('이메일 또는 비밀번호가 일치하지 않습니다');
    }

    // 이메일 인증 확인
    if (!user.email_verified) {
      throw new Error('이메일 인증이 완료되지 않았습니다');
    }

    // 사용자 상태 확인
    if (user.status !== 'active') {
      throw new Error('비활성화된 계정입니다');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('이메일 또는 비밀번호가 일치하지 않습니다');
    }

    // 토큰 생성
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // last_login 업데이트
    await UserModel.updateLastLogin(user._id);

    return {
      success: true,
      message: '로그인되었습니다',
      token,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        name_en: user.name_en,
        position: user.position,
        phone: user.phone,
        role: user.role || 'user'
      }
    };
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const token = generateToken(decoded.userId);

    return {
      success: true,
      token
    };
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    throw new Error('토큰 갱신에 실패했습니다');
  }
};

const getCurrentUser = async (userId) => {
  try {
    // MongoDB에서 사용자 조회
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        name_en: user.name_en,
        position: user.position,
        phone: user.phone,
        role: user.role || 'user',
        status: user.status,
        email_verified: user.email_verified,
        is_smatch_domain: user.is_smatch_domain,
        created_at: user.created_at,
        last_login: user.last_login
      }
    };
  } catch (error) {
    console.error('❌ Get user error:', error);
    throw error;
  }
};

module.exports = {
  register,
  verifyEmail,
  completeRegistration,
  login,
  refreshAccessToken,
  getCurrentUser,
  generateToken,
  generateRefreshToken
};
