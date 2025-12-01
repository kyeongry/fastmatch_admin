const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const { list, getById, approve, reject } = require('../controllers/deleteRequest.controller');

// 모든 라우트에 인증 필요
router.use(authMiddleware);

// 모든 라우트에 Admin 권한 필요
router.use(adminMiddleware);

// GET /api/delete-requests - 삭제 요청 목록 조회 (Admin만)
router.get('/', list);

// GET /api/delete-requests/:id - 삭제 요청 상세 조회 (Admin만)
router.get('/:id', getById);

// POST /api/delete-requests/:id/approve - 삭제 요청 승인 (Admin만)
router.post('/:id/approve', approve);

// POST /api/delete-requests/:id/reject - 삭제 요청 거부 (Admin만)
router.post('/:id/reject', reject);

module.exports = router;
