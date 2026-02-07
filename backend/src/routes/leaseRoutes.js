const express = require('express');
const router = express.Router();
const leaseController = require('../controllers/leaseController');
const multer = require('multer');

// 파일 업로드 설정 (메모리 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
});

// ============================================
// 물건 정보 (STEP 1)
// ============================================

// 등기부등본에서 정보 추출 (Gemini)
router.post('/extract-registry', upload.single('file'), leaseController.extractRegistry);

// 건축물대장 조회 (공공데이터 API)
router.get('/building-ledger', leaseController.getBuildingLedger);

// ============================================
// 당사자 정보 (STEP 2)
// ============================================

// 사업자등록증/신분증에서 정보 추출 (Gemini)
router.post('/extract-party', upload.single('file'), leaseController.extractPartyInfo);

// ============================================
// 위치 정보
// ============================================

// 대중교통 정보 조회 (카카오맵 API)
router.get('/location/transit', leaseController.getTransitInfo);

// ============================================
// 특약 관리 (STEP 4)
// ============================================

// 기본 특약 목록 조회
router.get('/special-terms/defaults', leaseController.getDefaultTerms);

// 특약 검색 (키워드 기반)
router.get('/special-terms', leaseController.searchSpecialTerms);

// AI 특약 생성 (Gemini)
router.post('/special-terms/generate', leaseController.generateSpecialTerms);

// 특약 저장
router.post('/special-terms', leaseController.saveSpecialTerm);

// 특약 사용 횟수 증가
router.put('/special-terms/:id/use', leaseController.incrementSpecialTermUsage);

// ============================================
// 계약서 CRUD
// ============================================

// 계약서 목록 조회
router.get('/contracts', leaseController.getContracts);

// 계약서 검색
router.get('/contracts/search', leaseController.searchContracts);

// 계약서 생성 (초안)
router.post('/contracts', leaseController.createContract);

// 계약서 상세 조회
router.get('/contracts/:id', leaseController.getContract);

// 계약서 수정
router.put('/contracts/:id', leaseController.updateContract);

// 계약서 삭제
router.delete('/contracts/:id', leaseController.deleteContract);

// 계약서 완료 처리
router.post('/contracts/:id/complete', leaseController.completeContract);

// PDF 생성
router.post('/contracts/:id/pdf', leaseController.generatePdf);

// PDF 다운로드 (GET)
router.get('/contracts/:id/pdf', leaseController.generatePdf);

// ============================================
// 관리자 기능
// ============================================

// 공제증서 업로드
router.post('/admin/insurance-cert', upload.single('file'), leaseController.uploadInsuranceCert);

// 공제증서 목록 조회
router.get('/admin/insurance-cert', leaseController.getInsuranceCerts);

// 공제증서 활성화
router.put('/admin/insurance-cert/:id/activate', leaseController.activateInsuranceCert);

module.exports = router;
