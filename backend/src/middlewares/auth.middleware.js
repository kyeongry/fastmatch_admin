const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.mongodb');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 없습니다',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 데이터베이스에서 사용자 조회
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '인증되지 않은 사용자입니다',
      });
    }

    // 사용자 정보를 req에 저장
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      status: user.status,
    };

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다',
      });
    }

    return res.status(401).json({
      success: false,
      message: '인증에 실패했습니다',
    });
  }
};

module.exports = authMiddleware;
