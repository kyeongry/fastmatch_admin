import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { proposalRequestAPI } from '../../services/api';

const ProposalRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await proposalRequestAPI.getById(id);
      setRequest(response.data.proposal);
    } catch (error) {
      console.error('제안 요청 조회 실패:', error);
      alert('제안 요청을 불러올 수 없습니다');
      navigate('/proposals/requests');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoveInPeriodText = (period) => {
    const map = {
      'early': '초순',
      'mid': '중순',
      'late': '하순',
      'all': '전체'
    };
    return map[period] || period;
  };

  const getSendTypeText = (type) => {
    const map = {
      'initial': '최초발송',
      'additional': '추가발송',
      'modified': '변경발송'
    };
    return map[type] || type;
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
          <h1 className="text-3xl font-bold">제안 요청 상세</h1>
          <button
            onClick={() => navigate('/proposals/requests')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            목록으로
          </button>
        </div>

        {/* 고객사 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">고객사 정보</h2>
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
        </div>

        {/* 입주 조건 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">입주 조건</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">희망 지하철역</p>
              <p className="font-medium">{request.desired_subway}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">실사용 인원</p>
              <p className="font-medium">{request.actual_users}명</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">희망 인실</p>
              <p className="font-medium">{request.desired_capacity ? `${request.desired_capacity}인실` : '미지정'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">입주 예정일</p>
              <p className="font-medium">
                {new Date(request.move_in_date).toLocaleDateString('ko-KR')}
                {' '}({getMoveInPeriodText(request.move_in_period)})
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">임대 기간</p>
              <p className="font-medium">{request.rental_period}개월</p>
            </div>
            {request.additional_info && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">추가 정보</p>
                <p className="font-medium whitespace-pre-wrap">{request.additional_info}</p>
              </div>
            )}
          </div>
        </div>

        {/* 발송 내역 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">발송 내역</h2>
          {request.send_history && request.send_history.length > 0 ? (
            <div className="space-y-3">
              {request.send_history.map((history, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">
                      {history.brand_name || `브랜드 ${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {history.manager_name && `${history.manager_name} / `}
                      {history.manager_email}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      history.send_type === 'initial' ? 'bg-blue-100 text-blue-800' :
                      history.send_type === 'additional' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {getSendTypeText(history.send_type)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(history.sent_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">발송 내역이 없습니다</p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => navigate(`/proposals/requests/${id}/add`)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            추가 제안 요청
          </button>
          <button
            onClick={() => navigate(`/proposals/requests/${id}/modify`)}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            변경 제안 요청
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ProposalRequestDetail;
