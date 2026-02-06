const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { list, getById, create, update, remove, generatePDF, createAndGeneratePDF } = require('../controllers/proposalDocument.controller');

// 모든 라우트에 인증 필요
router.use(authMiddleware);

// GET /api/proposals/documents - 제안서 목록 조회
router.get('/', list);

// POST /api/proposals/documents - 제안서 생성
router.post('/', create);

// POST /api/proposals/documents/create-pdf - 제안서 생성 + PDF 생성 통합 (단일 요청)
router.post('/create-pdf', createAndGeneratePDF);

// GET /api/proposals/documents/:id - 제안서 상세 조회
router.get('/:id', getById);

// GET /api/proposals/documents/:id/pdf - 제안서 PDF 생성 및 다운로드
router.get('/:id/pdf', generatePDF);

// PUT /api/proposals/documents/:id - 제안서 수정
router.put('/:id', update);

// DELETE /api/proposals/documents/:id - 제안서 삭제
router.delete('/:id', remove);

module.exports = router;
