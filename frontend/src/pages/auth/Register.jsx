import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const validateForm = () => {
    if (!email) {
      setError('이메일을 입력해주세요');
      return false;
    }

    if (!email.includes('@')) {
      setError('유효한 이메일 주소를 입력해주세요');
      return false;
    }

    if (!email.endsWith('@smatch.kr')) {
      setError('회원가입은 @smatch.kr 도메인만 가능합니다');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      await register(email);
      setSuccess('인증 코드를 이메일로 발송했습니다. 인증 페이지로 이동합니다...');

      // 이메일 인증 페이지로 이동
      setTimeout(() => {
        navigate('/verify-email', {
          state: { email },
        });
      }, 1500);
    } catch (err) {
      console.error('이메일 발송 에러:', err);
      setError(err.message || '인증 코드 발송 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 / 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">FASTMATCH</h1>
          <p className="text-gray-600">공유오피스 공간 관리 시스템</p>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">회원가입</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@smatch.kr"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-gray-500">@smatch.kr 도메인만 가입 가능합니다</p>
            </div>

            {/* 인증 코드 발송 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200"
            >
              {isLoading ? '인증 코드 발송 중...' : '인증 코드 발송'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                로그인
              </Link>
            </p>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 text-center text-gray-600 text-xs">
          <p>© 2024 FASTMATCH. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
