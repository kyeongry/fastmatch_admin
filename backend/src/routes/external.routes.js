const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const {
  searchAddressHandler,
  reverseGeocodeHandler,
  searchSubwayHandler,
  searchSubwayExtendedHandler,
  getBuildingHandler,
  getBuildingByLocationHandler,
  getAdminCodeHandler,
} = require('../controllers/externalApi.controller');

// 모든 라우트에 인증 필요
router.use(authMiddleware);

// GET /api/external/address/search?query=서울시강남구
// 주소 검색 (KakaoMap)
router.get('/address/search', searchAddressHandler);

// GET /api/external/address/reverse?latitude=37.4979&longitude=127.0276
// 좌표로 주소 역검색 (KakaoMap)
router.get('/address/reverse', reverseGeocodeHandler);

// GET /api/external/subway/search?latitude=37.4979&longitude=127.0276&radius=1000
// 근처 지하철역 검색 (KakaoMap)
router.get('/subway/search', searchSubwayHandler);

// GET /api/external/subway/search-extended?latitude=37.4979&longitude=127.0276&maxRadius=20000
// 근처 지하철역 확장 검색 (반경 자동 확대, 대중교통 시간 포함)
router.get('/subway/search-extended', searchSubwayExtendedHandler);

// GET /api/external/building?sigunguCode=11680&buildingNumber=10000-1234
// 건물 정보 조회 (건축물대장)
router.get('/building', getBuildingHandler);

// GET /api/external/building/location?latitude=37.4979&longitude=127.0276
// 위치 기반 건물 정보 조회
router.get('/building/location', getBuildingByLocationHandler);

// GET /api/external/admin-code?address=서울시강남구
// 주소로 시군구 코드 조회
router.get('/admin-code', getAdminCodeHandler);

module.exports = router;
