const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Gmail API 연결 테스트
const gmailService = require('./services/gmail.service');
gmailService.testConnection().then(result => {
  if (result.success) {
    console.log('Gmail API ready:', result.email);
  }
});

const app = express();

// 허용된 origin인지 확인하는 함수
function isAllowedOrigin(origin) {
  if (!origin) return true;

  if (origin.includes('vercel.app') ||
      origin.includes('fastmatch') ||
      origin.includes('localhost')) {
    return true;
  }

  const allowedOrigins = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  return allowedOrigins.includes(origin);
}

// 수동 CORS 헤더 설정
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// CORS 설정
const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 프로덕션에서는 간결한 로깅
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

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
  console.log(`Server running on port ${PORT}`);

  // 제안서 자동 삭제 스케줄러 시작
  const { startScheduler } = require('./schedulers/proposalCleanup.scheduler');
  startScheduler();
});

// PDF 생성 등 장시간 요청을 위한 서버 타임아웃 설정 (10분)
server.timeout = 600000;
server.keepAliveTimeout = 620000;
server.headersTimeout = 630000;
