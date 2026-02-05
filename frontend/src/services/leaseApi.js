import api from './api';

/**
 * 임대차 계약 자동화 API
 */

// ============ 등기부등본 추출 API ============
export const registryAPI = {
  // 등기부등본 이미지에서 정보 추출 (Gemini AI)
  extractInfo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/lease/extract-registry', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ============ 건축물대장 API ============
export const buildingLedgerAPI = {
  // 주소로 건축물대장 조회
  getByAddress: (address) =>
    api.get('/lease/building-ledger', { params: { address } }),
};

// ============ 특약 API ============
export const specialTermsAPI = {
  // 키워드로 특약 검색
  search: (keyword) =>
    api.get('/lease/special-terms/search', { params: { keyword } }),

  // AI 특약 생성 (3가지 버전)
  generate: (situation, context = {}) =>
    api.post('/lease/special-terms/generate', { situation, context }),

  // 특약 라이브러리에 저장
  save: (termData) => api.post('/lease/special-terms', termData),

  // 기본 특약 목록 조회
  getDefaults: () => api.get('/lease/special-terms/defaults'),
};

// ============ 임대차 계약서 API ============
export const contractAPI = {
  // 계약서 목록 조회
  getAll: (params) => api.get('/lease/contracts', { params }),

  // 계약서 상세 조회
  getById: (id) => api.get(`/lease/contracts/${id}`),

  // 계약서 생성 (초안)
  create: (data) => api.post('/lease/contracts', data),

  // 계약서 업데이트
  update: (id, data) => api.put(`/lease/contracts/${id}`, data),

  // 계약서 삭제
  delete: (id) => api.delete(`/lease/contracts/${id}`),

  // 계약서 완료 처리 및 PDF 생성
  complete: (id) => api.post(`/lease/contracts/${id}/complete`),

  // PDF 다운로드
  downloadPDF: (id) =>
    api.get(`/lease/contracts/${id}/pdf`, { responseType: 'blob' }),
};

// ============ 보증보험증권 API ============
export const insuranceCertAPI = {
  // 현재 보증보험증권 조회
  getCurrent: () => api.get('/lease/admin/insurance-cert'),

  // 보증보험증권 업로드 (관리자)
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/lease/admin/insurance-cert', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ============ 당사자 정보 추출 API ============
export const partyAPI = {
  // 사업자등록증에서 정보 추출
  extractBusiness: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', 'business');
    return api.post('/lease/extract-party', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 신분증에서 정보 추출 (개인)
  extractIndividual: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', 'individual');
    return api.post('/lease/extract-party', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default {
  registryAPI,
  buildingLedgerAPI,
  specialTermsAPI,
  contractAPI,
  insuranceCertAPI,
  partyAPI,
};
