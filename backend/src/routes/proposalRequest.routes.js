const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { list, getById, create, addBrands, modify } = require('../controllers/proposalRequest.controller');

// 모든 라우트에 인증 필요
router.use(authMiddleware);

// GET /api/proposals/requests - 제안 요청 목록 조회
router.get('/', list);

// POST /api/proposals/requests - 제안 요청 생성
router.post('/', create);

// GET /api/proposals/requests/:id - 제안 요청 상세 조회
router.get('/:id', getById);

// POST /api/proposals/requests/:id/add - 추가 제안 요청
router.post('/:id/add', addBrands);

// POST /api/proposals/requests/:id/modify - 제안 요청 수정
router.post('/:id/modify', modify);

module.exports = router;
