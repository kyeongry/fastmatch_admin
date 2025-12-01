const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  uploadSingleImage,
  uploadMultiple,
  uploadBranchImages,
  uploadOptionFloorPlan,
  uploadProfileImage,
} = require('../controllers/upload.controller');

// Multer 설정 (메모리 스토리지)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // 이미지 파일만 허용
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// 모든 라우트에 인증 필요
router.use(authMiddleware);

// POST /api/upload/image - 단일 이미지 업로드
// query: type (branch, option, profile, general)
router.post('/image', upload.single('file'), uploadSingleImage);

// POST /api/upload/images - 여러 이미지 업로드
// query: type (branch, option, profile, general)
router.post('/images', upload.array('files', 10), uploadMultiple);

// POST /api/upload/branch/:branchId - 지점 이미지 업로드
// form-data: exterior (외부 이미지), interior (내부 이미지들)
router.post('/branch/:branchId', upload.fields([
  { name: 'exterior', maxCount: 1 },
  { name: 'interior', maxCount: 10 },
]), uploadBranchImages);

// POST /api/upload/option/:optionId/floor-plan - 옵션 플로어 플랜 업로드
router.post('/option/:optionId/floor-plan', upload.single('file'), uploadOptionFloorPlan);

// POST /api/upload/profile - 프로필 이미지 업로드
router.post('/profile', upload.single('file'), uploadProfileImage);

module.exports = router;
