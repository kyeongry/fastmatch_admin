const express = require('express');
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/reviews/branch/:branchId - 지점별 리뷰 조회
router.get('/branch/:branchId', authMiddleware, reviewController.getReviewsByBranch);

// POST /api/reviews - 리뷰 생성
router.post('/', authMiddleware, reviewController.createReview);

// PUT /api/reviews/:id - 리뷰 수정
router.put('/:id', authMiddleware, reviewController.updateReview);

// DELETE /api/reviews/:id - 리뷰 삭제
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;
