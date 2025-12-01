const nodemailer = require('nodemailer');

// Gmail SMTP 설정 (Railway 환경 호환)
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Gmail 서비스 사용 (자동으로 호스트/포트 설정)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // 타임아웃 설정 증가
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// 연결 테스트
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email config error:', error.message);
    console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '설정됨' : '미설정');
    console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '설정됨' : '미설정');
  } else {
    console.log('✅ Email config ready - Gmail connected');
  }
});

module.exports = transporter;
