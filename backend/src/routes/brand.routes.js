const express = require('express');
const brandController = require('../controllers/brand.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

const router = express.Router();

// GET /api/brands - 브랜드 목록 (인증 필수)
router.get('/', authMiddleware, brandController.getAllBrands);

// POST /api/brands - 브랜드 생성 (인증 + 관리자 필수)
router.post('/', authMiddleware, adminMiddleware, brandController.createBrand);

// GET /api/brands/:id - 브랜드 상세 (인증 필수)
router.get('/:id', authMiddleware, brandController.getBrandById);

// PUT /api/brands/:id - 브랜드 수정 (인증 + 관리자 필수)
router.put('/:id', authMiddleware, adminMiddleware, brandController.updateBrand);

// DELETE /api/brands/:id - 브랜드 삭제 (인증 + 관리자 필수)
router.delete('/:id', authMiddleware, adminMiddleware, brandController.deleteBrand);

// POST /api/brands/check-duplicate - 중복 확인 (인증 + 관리자 필수)
router.post('/check-duplicate', authMiddleware, adminMiddleware, brandController.checkDuplicate);

// GET /api/brands/available-for-addition - 추가 가능 브랜드 (인증 필수)
router.get('/available-for-addition', authMiddleware, brandController.getAvailableBrandsForAddition);

module.exports = router;
