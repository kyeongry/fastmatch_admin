const express = require('express');
const fs = require('fs');
const path = require('path');
// Auto-restart trigger
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// 디버깅: 폴더 구조 확인
console.log('📁 Current working directory:', process.cwd());
console.log('📁 __dirname:', __dirname);
const pdfformPath = path.join(process.cwd(), 'pdfform');
console.log('📁 pdfform path:', pdfformPath);
console.log('📁 pdfform exists:', fs.existsSync(pdfformPath));
if (fs.existsSync(pdfformPath)) {
  console.log('📁 pdfform contents:', fs.readdirSync(pdfformPath));
  const templatesPath = path.join(pdfformPath, 'templates');
  if (fs.existsSync(templatesPath)) {
    console.log('📁 templates contents:', fs.readdirSync(templatesPath));
  }
}

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
