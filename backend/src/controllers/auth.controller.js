// MongoDB만 사용 (PostgreSQL 의존성 제거)
const authService = require('../services/auth.service');

const register = async (req, res) => {
  try {
    const { email } = req.body;

    // 필수 항목 확인 (Step 1: email만 필수)
    if (!email) {
      return res.status(400).json({
        success: false,
        message: '이메일은 필수입니다'
      });
    }

    // Step 1: 이메일 입력 & 인증 코드 발송
    const result = await authService.register({ email });

    return res.status(200).json({
      success: true,
      message: result.message,
      email: result.email
    });
  } catch (error) {
    console.error('❌ Register controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, code, name, name_en, position, phone, password } = req.body;

    console.log('✉️ Verify email 요청:', { email, code, hasName: !!name, hasPhone: !!phone, hasPassword: !!password });

    if (!email || !code) {
      console.log('❌ 필수 필드 누락:', { email: !!email, code: !!code });
      return res.status(400).json({
        success: false,
        message: '이메일과 인증 코드가 필요합니다'
      });
    }

    // Step 1: 이메일 인증 확인
    console.log('🔍 이메일 인증 확인 시작:', email, code);
    await authService.verifyEmail(email, code);
    console.log('✅ 이메일 인증 확인 완료');

    // Step 2: 회원가입 완료 (name, phone, password가 있으면 사용자 생성)
    if (name && phone && password) {
      console.log('👤 회원가입 완료 시작:', { email, name, name_en, position, phone });
      const result = await authService.completeRegistration({
        email,
        name,
        name_en,
        position,
        phone,
        password
      });
      console.log('✅ 회원가입 완료 성공');

      return res.status(200).json({
        success: true,
        message: '회원가입이 완료되었습니다',
        email,
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user
      });
    }

    // 인증만 완료된 상태 (추후 회원가입 완료)
    return res.status(200).json({
      success: true,
      message: '이메일 인증이 완료되었습니다',
      email
    });
  } catch (error) {
    console.error('❌ Verify email controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호가 필요합니다'
      });
    }

    const result = await authService.login(email, password);

    // 리프레시 토큰은 HttpOnly 쿠키로 설정 (선택사항)
    // res.cookie('refreshToken', result.refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict'
    // });

    return res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error) {
    console.error('❌ Login controller error:', error);
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    // JWT 토큰은 stateless이므로 서버에서 추가 처리 불필요
    // 클라이언트에서 로컬 스토리지에서 토큰 삭제하도록 유도

    return res.status(200).json({
      success: true,
      message: '로그아웃되었습니다'
    });
  } catch (error) {
    console.error('❌ Logout controller error:', error);
    return res.status(500).json({
      success: false,
      message: '로그아웃 중 오류가 발생했습니다'
    });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: '리프레시 토큰이 필요합니다'
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: '토큰이 갱신되었습니다',
      token: result.token
    });
  } catch (error) {
    console.error('❌ Refresh token controller error:', error);
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

const me = async (req, res) => {
  try {
    const result = await authService.getCurrentUser(req.user.id);

    return res.status(200).json({
      success: true,
      user: result.user
    });
  } catch (error) {
    console.error('❌ Get me controller error:', error);
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  refresh,
  me
};
