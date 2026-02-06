const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { list, getById, getMy, create, update, requestDelete, cancelDelete, getCreators, complete, reactivate, getMonthlyFeeHistory } = require('../controllers/option.controller');

// 모든 라우트에 인증 필요
router.use(authMiddleware);

// GET /api/options/creators - 옵션 작성자 목록 조회
router.get('/creators', getCreators);

// GET /api/options - 옵션 목록 조회
router.get('/', list);

// GET /api/options/my - 내 옵션 목록 조회
router.get('/my', getMy);

// POST /api/options - 옵션 생성
router.post('/', create);

// GET /api/options/:id/monthly-fee-history - 월 고정비 변경 히스토리
router.get('/:id/monthly-fee-history', getMonthlyFeeHistory);

// GET /api/options/:id - 옵션 상세 조회
router.get('/:id', getById);

// PUT /api/options/:id - 옵션 수정
router.put('/:id', update);

// POST /api/options/:id/complete - 옵션 거래완료 처리
router.post('/:id/complete', complete);

// POST /api/options/:id/reactivate - 옵션 거래재개 처리
router.post('/:id/reactivate', reactivate);

// POST /api/options/:id/cancel-delete - 옵션 삭제 요청 취소
router.post('/:id/cancel-delete', cancelDelete);

// DELETE /api/options/:id - 옵션 삭제 요청
router.delete('/:id', requestDelete);

module.exports = router;
