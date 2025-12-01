import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const VerifyEmail = () => {
  const location = useLocation();
  const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 인증 코드, 3: 회원정보 입력
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const navigate = useNavigate();
  const { verifyEmail, register } = useAuth();

  // Register 페이지에서 넘어온 경우 이메일 설정
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
      setStep(2);
    }
  }, [location.state]);

  // Step 1: 이메일 입력 & 인증 코드 발송
  const handleSendCode = async (e) => {
    e?.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('이메일을 입력해주세요');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('유효한 이메일 주소를 입력해주세요');
      setIsLoading(false);
      return;
    }

    if (!email.endsWith('@smatch.kr')) {
      setError('회원가입은 @smatch.kr 도메인만 가능합니다');
      setIsLoading(false);
      return;
    }

    try {
      // 이메일 검증 및 인증 코드 발송
      await register(email);
      setSuccess('인증 코드가 이메일로 발송되었습니다');
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: 인증 코드 검증
  const handleVerifyCode = async (e) => {
    e?.preventDefault();
    setError('');
    setIsLoading(true);

    if (!code || code.length < 4) {
      setError('인증 코드를 입력해주세요');
      setIsLoading(false);
      return;
    }

    try {
      // 인증 코드만 검증 (회원정보는 Step 3에서 입력)
      await verifyEmail(email, code);
      setSuccess('이메일 인증이 완료되었습니다. 다음 페이지로 넘어갑니다');
      setTimeout(() => {
        setStep(3);
        setSuccess('');
      }, 1500);
    } catch (err) {
      console.error('인증 코드 검증 에러:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: 회원정보 입력 및 등록
  const handleRegister = async (e) => {
    e?.preventDefault();
    setError('');
    setIsLoading(true);

    // 클라이언트 검증
    if (!name || !phone || !password || !confirmPassword) {
      setError('필수 필드를 입력해주세요');
      setIsLoading(false);
      return;
    }

    if (name.length < 2) {
      setError('이름은 최소 2자 이상이어야 합니다');
      setIsLoading(false);
      return;
    }

    const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('유효한 전화번호를 입력해주세요 (예: 010-1234-5678)');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      setIsLoading(false);
      return;
    }

    try {
      // 회원가입 완료 (인증된 이메일 + 회원정보)
      const response = await verifyEmail(email, code, name, nameEn, position, phone, password);

      if (response.token) {
        // 토큰이 있으면 자동 로그인되어 메인 페이지로
        setSuccess('회원가입이 완료되었습니다. 메인 페이지로 이동합니다');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else {
        // 토큰이 없으면 로그인 페이지로
        setSuccess('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다');
        setTimeout(() => {
          navigate('/login', { state: { email } });
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 코드 재발송
  const handleResend = async () => {
    if (!email) {
      setError('이메일을 입력해주세요');
      return;
    }

    setResendLoading(true);
    try {
      await register(email);
      setSuccess('인증 코드가 다시 발송되었습니다');
      setCode('');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('코드 재발송에 실패했습니다');
    } finally {
      setResendLoading(false);
    }
  };

  // 이전 단계로
  const handleBack = () => {
    setError('');
    setSuccess('');
    if (step === 2) {
      setStep(1);
      setCode('');
    } else if (step === 3) {
      setStep(2);
      setCode('');
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h2>
          <p className="text-gray-500 text-sm mb-6">
            {step === 1 && '이메일 주소를 입력해주세요'}
            {step === 2 && '이메일로 받은 인증 코드를 입력해주세요'}
            {step === 3 && '회원 정보를 입력해주세요'}
          </p>

          {/* 진행 단계 표시 */}
          <div className="flex gap-2 mb-6">
            <div className={`h-1 flex-1 rounded ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`h-1 flex-1 rounded ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          </div>

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

          {/* Step 1: 이메일 입력 */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200"
              >
                {isLoading ? '발송 중...' : '인증 코드 발송'}
              </button>
            </form>
          )}

          {/* Step 2: 인증 코드 입력 */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="email2" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  id="email2"
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  인증 코드
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6자리 숫자"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isLoading || resendLoading}
                  maxLength="6"
                />
                <p className="text-gray-500 text-xs mt-1">숫자만 입력 가능합니다</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 mt-6 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200"
                >
                  {isLoading ? '검증 중...' : '다음'}
                </button>
              </div>

              {/* 재발송 옵션 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-3">인증 코드를 받지 못하셨나요?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading || isLoading}
                  className="w-full py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 font-semibold rounded-lg transition duration-200"
                >
                  {resendLoading ? '재발송 중...' : '인증 코드 재발송'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: 회원정보 입력 */}
          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="email3" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  id="email3"
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="nameEn" className="block text-sm font-medium text-gray-700 mb-2">
                  영문 이름 <span className="text-gray-400 text-xs">(선택)</span>
                </label>
                <input
                  id="nameEn"
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Hong Gildong"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                  직책 <span className="text-gray-400 text-xs">(선택)</span>
                </label>
                <input
                  id="position"
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="대리"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력해주세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 mt-6 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200"
                >
                  {isLoading ? '가입 중...' : '회원가입'}
                </button>
              </div>
            </form>
          )}

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

export default VerifyEmail;
