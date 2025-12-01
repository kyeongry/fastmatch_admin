import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL + '/api' || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: JWT 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 에러 처리 및 토큰 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 & 아직 갱신 시도 안 했으면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 로그인 페이지에서 발생한 401은 무시 (로그인 실패)
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }

      // 토큰이 없으면 로그인 페이지로
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // /auth/me 요청 실패 시 토큰 제거하고 로그인으로
      if (originalRequest.url?.includes('/auth/me')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Refresh token 시도
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          const newToken = response.data.token;
          localStorage.setItem('token', newToken);

          // 새 토큰으로 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          // Refresh token 없으면 로그아웃
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } catch (refreshError) {
        // 토큰 갱신 실패 - 로그인 페이지로 이동
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============ Auth API ============
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ============ Brand API ============
export const brandAPI = {
  getAll: (params) => api.get('/brands', { params }),
  getById: (id) => api.get(`/brands/${id}`),
  create: (data) => api.post('/brands', data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id) => api.delete(`/brands/${id}`),
  checkDuplicate: (data) => api.post('/brands/check-duplicate', data),
};

// ============ Manager API ============
export const managerAPI = {
  getAll: (params) => api.get('/managers', { params }),
  getById: (id) => api.get(`/managers/${id}`),
  create: (data) => api.post('/managers', data),
  update: (id, data) => api.put(`/managers/${id}`, data),
  delete: (id) => api.delete(`/managers/${id}`),
};

// ============ Branch API ============
export const branchAPI = {
  getAll: (params) => api.get('/branches', { params }),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
};

// ============ Option API ============
export const optionAPI = {
  getAll: (params) => api.get('/options', { params }),
  getById: (id) => api.get(`/options/${id}`),
  getMy: () => api.get('/options/my'),
  getCreators: () => api.get('/options/creators'),
  create: (data) => api.post('/options', data),
  update: (id, data) => api.put(`/options/${id}`, data),
  requestDelete: (id, data) => api.delete(`/options/${id}`, { data }),
  cancelDeleteRequest: (id) => api.post(`/options/${id}/cancel-delete`),
  complete: (id) => api.post(`/options/${id}/complete`),
  reactivate: (id) => api.post(`/options/${id}/reactivate`),
};

// ============ Delete Request API ============
export const deleteRequestAPI = {
  getAll: (params) => api.get('/delete-requests', { params }),
  getById: (id) => api.get(`/delete-requests/${id}`),
  approve: (id) => api.post(`/delete-requests/${id}/approve`),
  reject: (id, data) => api.post(`/delete-requests/${id}/reject`, data),
};

// ============ Proposal Request API ============
export const proposalRequestAPI = {
  getAll: (params) => api.get('/proposals/requests', { params }),
  getById: (id) => api.get(`/proposals/requests/${id}`),
  create: (data) => api.post('/proposals/requests', data),
  update: (id, data) => api.put(`/proposals/requests/${id}`, data),
  addBrands: (id, data) => api.post(`/proposals/requests/${id}/add`, data),
  modify: (id, data) => api.post(`/proposals/requests/${id}/modify`, data),
};

// ============ Proposal Document API ============
export const proposalDocumentAPI = {
  getAll: (params) => api.get('/proposals/documents', { params }),
  getById: (id) => api.get(`/proposals/documents/${id}`),
  create: (data) => api.post('/proposals/documents', data),
  update: (id, data) => api.put(`/proposals/documents/${id}`, data),
  delete: (id) => api.delete(`/proposals/documents/${id}`),
  generatePDF: (id, regenerate = false) =>
    api.get(`/proposals/documents/${id}/pdf`, {
      params: { regenerate },
      responseType: 'blob',
    }),
};

// ============ Upload API ============
export const uploadAPI = {
  image: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  pdf: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ============ External API ============
export const externalAPI = {
  // 주소 검색 (카카오맵)
  searchAddress: (query) => api.get('/external/address/search', { params: { query } }),
  // 좌표로 주소 역검색
  reverseGeocode: (latitude, longitude) => api.get('/external/address/reverse', { params: { latitude, longitude } }),
  // 근처 지하철역 검색
  searchSubway: (latitude, longitude, radius) => api.get('/external/subway/search', { params: { latitude, longitude, radius } }),
  // 건물 정보 조회
  getBuildingInfo: (sigunguCode, buildingNumber) => api.get('/external/building', { params: { sigunguCode, buildingNumber } }),
  // 위치 기반 건물 정보 조회
  getBuildingByLocation: (latitude, longitude, lotAddress, sigunguCode, bjdongCode, mainAddressNo, subAddressNo, mountainYn) =>
    api.get('/external/building/location', {
      params: {
        latitude,
        longitude,
        lotAddress,
        sigunguCode,
        bjdongCode,
        mainAddressNo, // 본번 (카카오맵 API에서 직접 받음)
        subAddressNo,  // 부번 (카카오맵 API에서 직접 받음)
        mountainYn     // 산 여부 (카카오맵 API에서 직접 받음)
      }
    }),
  // 시군구 코드 조회
  getAdminCode: (address) => api.get('/external/admin-code', { params: { address } }),
};

// ============ Admin API ============
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStatistics: () => api.get('/admin/statistics'),
  getActivities: () => api.get('/admin/activities'),
};

export default api;
