import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Modal from '../../components/common/Modal';
import { proposalRequestAPI, brandAPI } from '../../services/api';

const ProposalRequestAdd = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [requestRes, brandsRes] = await Promise.all([
        proposalRequestAPI.getById(id),
        brandAPI.getAvailableForAddition(id)
      ]);

      setRequest(requestRes.data.proposal);
      setAvailableBrands(brandsRes.data.brands || []);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      alert('데이터를 불러올 수 없습니다');
      navigate('/proposals/requests');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandToggle = (brandId) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const handleSubmit = async () => {
    if (selectedBrands.length === 0) {
      alert('최소 1개 이상의 브랜드를 선택해주세요');
      return;
    }

    setSending(true);
    try {
      await proposalRequestAPI.addBrands(id, {
        additional_brands: selectedBrands
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('추가 발송 실패:', error);
      alert(error.response?.data?.message || '추가 발송에 실패했습니다');
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
          <h1 className="text-3xl font-bold">추가 제안 요청</h1>
          <button
            onClick={() => navigate(`/proposals/requests/${id}`)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
        </div>

        {/* 기존 제안 정보 (읽기 전용) */}
        <div className="bg-gray-50 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">기존 제안 정보</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">고객사명</p>
              <p className="font-medium">{request.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">담당자</p>
              <p className="font-medium">{request.contact_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">희망 지하철역</p>
              <p className="font-medium">{request.desired_subway}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">실사용 인원</p>
              <p className="font-medium">{request.actual_users}명</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">기존 발송 브랜드</p>
            <div className="flex flex-wrap gap-2">
              {request.selected_brands && request.selected_brands.map((brand, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {brand.name || `브랜드 ${index + 1}`}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 추가 브랜드 선택 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">추가 브랜드 선택</h2>

          {availableBrands.length === 0 ? (
            <p className="text-gray-500">추가 가능한 브랜드가 없습니다</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {availableBrands.map(brand => (
                  <label
                    key={brand.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                      selectedBrands.includes(brand.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand.id)}
                      onChange={() => handleBrandToggle(brand.id)}
                      className="mr-2"
                    />
                    <span className="text-sm">{brand.name}</span>
                  </label>
                ))}
              </div>

              {selectedBrands.length > 0 && (
                <p className="text-sm text-gray-600">
                  선택된 브랜드: {selectedBrands.length}개
                </p>
              )}
            </>
          )}
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate(`/proposals/requests/${id}`)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending || selectedBrands.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {sending ? '발송 중...' : '추가 발송'}
          </button>
        </div>
      </div>

      {/* 성공 모달 */}
      {showSuccessModal && (
        <Modal onClose={() => setShowSuccessModal(false)} size="md">
          <div className="text-center py-6">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4">추가 발송이 완료되었습니다</h2>
            <p className="text-lg mb-2">발송 완료: {selectedBrands.length}개 브랜드</p>
            <p className="text-gray-600 mb-6">
              📧 브랜드 답변은 내 이메일로 직접 전달됩니다
            </p>
            <button
              onClick={() => navigate(`/proposals/requests/${id}`)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              상세 페이지로
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default ProposalRequestAdd;
