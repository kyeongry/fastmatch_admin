const { Resend } = require('resend');

// Resend API 설정 (Railway 환경에서 안정적)
const resend = new Resend(process.env.RESEND_API_KEY);

// 설정 확인
if (process.env.RESEND_API_KEY) {
  console.log('✅ Resend API configured');
} else {
  console.log('❌ RESEND_API_KEY not set');
}

module.exports = resend;
