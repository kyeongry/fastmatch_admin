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
console.log('🚀🚀🚀 SERVER VERSION: 2025-12-01-v2 🚀🚀🚀');
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

// Middlewares
app.use(helmet());

// CORS 설정 - 여러 도메인 허용
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // origin이 없는 경우 (서버 간 요청, Postman 등) 허용
    if (!origin) return callback(null, true);

    // Vercel 프리뷰 URL 패턴 허용
    if (origin.includes('vercel.app') || origin.includes('fastmatch')) {
      return callback(null, true);
    }

    // 허용된 origin 체크
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
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
// app.use('/api/users', require('./routes/user.routes'));

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // 제안서 자동 삭제 스케줄러 시작
  const { startScheduler } = require('./schedulers/proposalCleanup.scheduler');
  startScheduler();
});

// Restart trigger
