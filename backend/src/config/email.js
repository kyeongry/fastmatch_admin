const nodemailer = require('nodemailer');

// Gmail SMTP 설정 (포트 465 SSL 사용)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,  // SSL 사용
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // 타임아웃 설정
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  // TLS 설정
  tls: {
    rejectUnauthorized: false
  }
});

// 연결 테스트
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email config error:', error.message);
  } else {
    console.log('✅ Gmail SMTP connected (port 465 SSL)');
  }
});

module.exports = transporter;
