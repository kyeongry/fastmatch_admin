const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const {
  getDashboard,
  getMonthlyData,
  getBrandData,
  getOptionData,
  getProposalData,
  getActivities,
} = require('../controllers/admin.controller');

// 모든 라우트에 인증 + Admin 권한 필요
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/dashboard - 대시보드 통계
// 전체 통계: 사용자, 브랜드, 지점, 옵션, 제안, 삭제요청
router.get('/dashboard', getDashboard);

// GET /api/admin/stats/monthly?months=12 - 월별 통계
// 기본값: 12개월, 최대: 24개월
router.get('/stats/monthly', getMonthlyData);

// GET /api/admin/stats/brands - 브랜드별 통계
// 브랜드별 매니저, 지점, 제안 수
router.get('/stats/brands', getBrandData);

// GET /api/admin/stats/options - 옵션 상태별 통계
// 활성, 삭제요청중, 삭제됨
router.get('/stats/options', getOptionData);

// GET /api/admin/stats/proposals - 제안 요청 상태별 통계
// 발송됨, 발송실패, 발송중
router.get('/stats/proposals', getProposalData);

// GET /api/admin/activities?limit=10 - 최근 활동
// 기본값: 10개, 최대: 50개
router.get('/activities', getActivities);

module.exports = router;
