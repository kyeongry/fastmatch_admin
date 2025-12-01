const errorMiddleware = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 에러 로깅
  console.error('❌ Error:', {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // 기본 에러 상태 코드
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || '내부 서버 오류가 발생했습니다';

  // 응답
  res.status(statusCode).json({
    success: false,
    message,
    error: isDevelopment ? err.message : undefined
  });
};

module.exports = errorMiddleware;
