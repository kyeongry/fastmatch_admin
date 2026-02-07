import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Modal from '../../components/common/Modal';
import { proposalRequestAPI, brandAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProposalRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sendCount, setSendCount] = useState(0);

  const [formData, setFormData] = useState({
    // 고객사 정보
    company_name: '',
    contact_name: '',
    contact_position: '',
    contact_phone: '',
    contact_email: '',

    // 입주 조건
    desired_subway: '',
    actual_users: '',
    desired_capacity: '',
    move_in_date: '',
    move_in_period: 'all',
    rental_period: '',
    additional_info: '',

    // 브랜드 선택
    selected_brands: []
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await brandAPI.getAll();
      setBrands(response.data.brands || []);
    } catch (error) {
      console.error('브랜드 목록 조회 실패:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 에러 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBrandToggle = (brandId) => {
    setFormData(prev => ({
      ...prev,
      selected_brands: prev.selected_brands.includes(brandId)
        ? prev.selected_brands.filter(id => id !== brandId)
        : [...prev.selected_brands, brandId]
    }));
    // 브랜드 선택 에러 제거
    if (errors.selected_brands) {
      setErrors(prev => ({
        ...prev,
        selected_brands: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 고객사 정보
    if (!formData.company_name.trim()) {
      newErrors.company_name = '고객사명을 입력해주세요';
    }
    if (!formData.contact_name.trim()) {
      newErrors.contact_name = '담당자 이름을 입력해주세요';
    }
    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = '담당자 연락처를 입력해주세요';
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.contact_phone)) {
      newErrors.contact_phone = '010-0000-0000 형식으로 입력해주세요';
    }
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = '담당자 이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = '유효한 이메일을 입력해주세요';
    }

    // 입주 조건
    if (!formData.desired_subway.trim()) {
      newErrors.desired_subway = '희망 지하철역을 입력해주세요';
    }
    if (!formData.actual_users) {
      newErrors.actual_users = '실사용 인원을 입력해주세요';
    }
    if (!formData.move_in_date) {
      newErrors.move_in_date = '입주 예정일을 선택해주세요';
    }
    if (!formData.rental_period) {
      newErrors.rental_period = '임대 기간을 입력해주세요';
    }

    // 브랜드 선택
    if (formData.selected_brands.length === 0) {
      newErrors.selected_brands = '최소 1개 이상의 브랜드를 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('입력 항목을 확인해주세요');
      return;
    }

    setLoading(true);
    try {
      const response = await proposalRequestAPI.create({
        ...formData,
        actual_users: parseInt(formData.actual_users),
        desired_capacity: formData.desired_capacity ? parseInt(formData.desired_capacity) : null,
        rental_period: parseInt(formData.rental_period)
      });

      setSendCount(formData.selected_brands.length);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('제안 요청 생성 실패:', error);
      alert(error.response?.data?.message || '제안 요청 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">제안 요청 생성</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 고객사 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">고객사 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  고객사명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg ${errors.company_name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.company_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  담당자 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg ${errors.contact_name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.contact_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">담당자 직책</label>
                <input
                  type="text"
                  name="contact_position"
                  value={formData.contact_position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  담당자 연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="010-0000-0000"
                  className={`w-full px-3 py-2 border rounded-lg ${errors.contact_phone ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.contact_phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  담당자 이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg ${errors.contact_email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.contact_email && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
                )}
              </div>
            </div>
          </div>

          {/* 입주 조건 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">입주 조건</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  희망 지하철역 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="desired_subway"
                  value={formData.desired_subway}
                  onChange={handleChange}
                  placeholder="예: 강남역"
                  className={`w-full px-3 py-2 border rounded-lg ${errors.desired_subway ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.desired_subway && (
                  <p className="text-red-500 text-sm mt-1">{errors.desired_subway}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  실사용 인원 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="actual_users"
                  value={formData.actual_users}
                  onChange={handleChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg ${errors.actual_users ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.actual_users && (
                  <p className="text-red-500 text-sm mt-1">{errors.actual_users}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">희망 인실</label>
                <input
                  type="number"
                  name="desired_capacity"
                  value={formData.desired_capacity}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  입주 예정일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="move_in_date"
                  value={formData.move_in_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg ${errors.move_in_date ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.move_in_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.move_in_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  입주 희망 기간 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {['early', 'mid', 'late', 'all'].map(period => (
                    <label key={period} className="flex items-center">
                      <input
                        type="radio"
                        name="move_in_period"
                        value={period}
                        checked={formData.move_in_period === period}
                        onChange={handleChange}
                        className="mr-1"
                      />
                      {period === 'early' ? '초순' : period === 'mid' ? '중순' : period === 'late' ? '하순' : '전체'}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  임대 기간 (개월) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="rental_period"
                  value={formData.rental_period}
                  onChange={handleChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg ${errors.rental_period ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.rental_period && (
                  <p className="text-red-500 text-sm mt-1">{errors.rental_period}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">추가 정보</label>
                <textarea
                  name="additional_info"
                  value={formData.additional_info}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="추가로 전달할 사항이 있으면 입력해주세요"
                />
              </div>
            </div>
          </div>

          {/* 브랜드 선택 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              브랜드 선택 <span className="text-red-500">*</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {brands.map(brand => (
                <label
                  key={brand.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    formData.selected_brands.includes(brand.id)
                      ? 'border-primary-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.selected_brands.includes(brand.id)}
                    onChange={() => handleBrandToggle(brand.id)}
                    className="mr-2"
                  />
                  <span className="text-sm">{brand.name}</span>
                </label>
              ))}
            </div>
            {errors.selected_brands && (
              <p className="text-red-500 text-sm mt-2">{errors.selected_brands}</p>
            )}
            {formData.selected_brands.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                선택된 브랜드: {formData.selected_brands.length}개
              </p>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400"
            >
              {loading ? '발송 중...' : '제안 요청 발송'}
            </button>
          </div>
        </form>
      </div>

      {/* 성공 모달 */}
      {showSuccessModal && (
        <Modal onClose={() => setShowSuccessModal(false)} size="md">
          <div className="text-center py-6">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4">제안 요청이 발송되었습니다</h2>
            <p className="text-lg mb-2">발송 완료: {sendCount}개 브랜드</p>
            <p className="text-gray-600 mb-6">
              📧 브랜드 답변은 내 이메일로 직접 전달됩니다
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/proposals/requests')}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                제안 요청 관리
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                메인으로
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default ProposalRequest;
