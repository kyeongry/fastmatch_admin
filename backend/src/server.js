const express = require('express');
const fs = require('fs');
const path = require('path');
// Auto-restart trigger
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// 디버깅: 폴더 구조 확인
console.log('');
console.log('🚀🚀🚀 SERVER VERSION: 2025-12-01-v3 (Gmail API) 🚀🚀🚀');

// Gmail API 연결 테스트
const gmailService = require('./services/gmail.service');
gmailService.testConnection().then(result => {
  if (result.success) {
    console.log('✅ Gmail API ready:', result.email);
  } else {
    console.log('❌ Gmail API not configured:', result.error);
  }
});
console.log('========== DIRECTORY DEBUG START ==========');
console.log('📁 Current working directory:', process.cwd());
console.log('📁 __dirname:', __dirname);

// 현재 디렉토리의 모든 파일/폴더 나열
try {
  const cwdContents = fs.readdirSync(process.cwd());
  console.log('📁 CWD contents:', cwdContents);
} catch (e) {
  console.log('❌ Cannot read CWD:', e.message);
}

// pdfform 경로 체크 (여러 가능한 위치)
const possiblePaths = [
  path.join(process.cwd(), 'pdfform'),
  path.join(__dirname, '../pdfform'),
  path.join(__dirname, '../../pdfform'),
  '/app/pdfform',
];

console.log('📁 Checking possible pdfform paths:');
let foundPdfformPath = null;
for (const p of possiblePaths) {
  const exists = fs.existsSync(p);
  console.log(`  - ${p}: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  if (exists && !foundPdfformPath) {
    foundPdfformPath = p;
    try {
      console.log(`    Contents: ${fs.readdirSync(p).join(', ')}`);
      const templatesPath = path.join(p, 'templates');
      if (fs.existsSync(templatesPath)) {
        console.log(`    Templates: ${fs.readdirSync(templatesPath).join(', ')}`);
      }
    } catch (e) {
      console.log(`    Error reading: ${e.message}`);
    }
  }
}
console.log('========== DIRECTORY DEBUG END ============');

const app = express();

// 허용된 origin인지 확인하는 함수
function isAllowedOrigin(origin) {
  if (!origin) return true; // 서버 간 요청, Postman 등

  // Vercel 및 fastmatch 도메인 허용
  if (origin.includes('vercel.app') ||
      origin.includes('fastmatch') ||
      origin.includes('localhost')) {
    return true;
  }

  // 환경 변수로 설정된 도메인 허용
  const allowedOrigins = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  return allowedOrigins.includes(origin);
}

// 수동 CORS 헤더 설정 - 모든 요청에 대해 먼저 적용
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Max-Age', '86400'); // 24시간 캐시
  }

  // Preflight 요청 즉시 응답
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// CORS 설정 - 백업용 (cors 패키지)
const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.log('CORS 차단된 origin:', origin);
    // 에러 대신 false 반환 (헤더는 이미 위에서 설정됨)
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

// cors 미들웨어도 적용 (이중 보험)
app.use(cors(corsOptions));

// Middlewares - helmet은 CORS 이후에
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/brands', require('./routes/brand.routes'));
app.use('/api/managers', require('./routes/manager.routes'));
app.use('/api/branches', require('./routes/branch.routes'));
app.use('/api/options', require('./routes/option.routes'));
app.use('/api/delete-requests', require('./routes/deleteRequest.routes'));
app.use('/api/proposals/requests', require('./routes/proposalRequest.routes'));
app.use('/api/proposals/documents', require('./routes/proposalDocument.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/external', require('./routes/external.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
// app.use('/api/users', require('./routes/user.routes'));

// 임대차 계약 자동화 모듈
app.use('/api/lease', require('./routes/leaseRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Middleware
const errorMiddleware = require('./middlewares/error.middleware');
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // 제안서 자동 삭제 스케줄러 시작
  const { startScheduler } = require('./schedulers/proposalCleanup.scheduler');
  startScheduler();
});

// PDF 생성 등 장시간 요청을 위한 서버 타임아웃 설정 (10분)
server.timeout = 600000;
server.keepAliveTimeout = 620000;
server.headersTimeout = 630000;

// Restart trigger
