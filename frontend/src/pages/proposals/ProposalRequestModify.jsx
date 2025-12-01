import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Modal from '../../components/common/Modal';
import { proposalRequestAPI } from '../../services/api';

const ProposalRequestModify = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    desired_subway: '',
    actual_users: '',
    desired_capacity: '',
    move_in_date: '',
    move_in_period: 'all',
    rental_period: '',
    additional_info: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await proposalRequestAPI.getById(id);
      const req = response.data.proposal;
      setRequest(req);

      // 폼 데이터 초기화
      setFormData({
        desired_subway: req.desired_subway || '',
        actual_users: req.actual_users || '',
        desired_capacity: req.desired_capacity || '',
        move_in_date: req.move_in_date?.split('T')[0] || '',
        move_in_period: req.move_in_period || 'all',
        rental_period: req.rental_period || '',
        additional_info: req.additional_info || ''
      });
    } catch (error) {
      console.error('제안 요청 조회 실패:', error);
      alert('제안 요청을 불러올 수 없습니다');
      navigate('/proposals/requests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('입력 항목을 확인해주세요');
      return;
    }

    setSending(true);
    try {
      await proposalRequestAPI.modify(id, {
        ...formData,
        actual_users: parseInt(formData.actual_users),
        desired_capacity: formData.desired_capacity ? parseInt(formData.desired_capacity) : null,
        rental_period: parseInt(formData.rental_period)
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('변경 발송 실패:', error);
      alert(error.response?.data?.message || '변경 발송에 실패했습니다');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <p className="text-center py-12">로딩 중...</p>
        </div>
      </Layout>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">변경 제안 요청</h1>
          <button
            onClick={() => navigate(`/proposals/requests/${id}`)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
        </div>

        {/* 고객사 정보 (읽기 전용) */}
        <div className="bg-gray-50 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">고객사 정보 (변경 불가)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">고객사명</p>
              <p className="font-medium">{request.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">담당자</p>
              <p className="font-medium">
                {request.contact_name}
                {request.contact_position && ` (${request.contact_position})`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">연락처</p>
              <p className="font-medium">{request.contact_phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">이메일</p>
              <p className="font-medium">{request.contact_email}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-sm text-gray-500 mb-2">기존 발송 브랜드</p>
            <div className="flex flex-wrap gap-2">
              {request.selected_brands && request.selected_brands.map((brand, index) => (
                <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  {brand.name || `브랜드 ${index + 1}`}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 입주 조건 (수정 가능) */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">입주 조건 (변경 가능)</h2>
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
                />
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/proposals/requests/${id}`)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
            >
              {sending ? '발송 중...' : '변경 발송'}
            </button>
          </div>
        </form>
      </div>

      {/* 성공 모달 */}
      {showSuccessModal && (
        <Modal onClose={() => setShowSuccessModal(false)} size="md">
          <div className="text-center py-6">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4">변경 발송이 완료되었습니다</h2>
            <p className="text-lg mb-2">
              기존 발송 브랜드: {request.selected_brands?.length || 0}개
            </p>
            <p className="text-gray-600 mb-6">
              📧 변경된 내용이 모든 브랜드에 재발송되었습니다
            </p>
            <button
              onClick={() => navigate(`/proposals/requests/${id}`)}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              상세 페이지로
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default ProposalRequestModify;
