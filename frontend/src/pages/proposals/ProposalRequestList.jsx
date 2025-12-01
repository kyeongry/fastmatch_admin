import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { proposalRequestAPI } from '../../services/api';

const ProposalRequestList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await proposalRequestAPI.getAll();
      setRequests(response.data.proposals || []);
    } catch (error) {
      console.error('제안 요청 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">제안 요청 관리</h1>
          <button
            onClick={() => navigate('/proposals/request')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 새 제안 요청
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">제안 요청이 없습니다</p>
            <button
              onClick={() => navigate('/proposals/request')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              첫 제안 요청 생성하기
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map(request => (
              <div
                key={request.id}
                onClick={() => navigate(`/proposals/requests/${request.id}`)}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{request.company_name}</h3>
                    <p className="text-gray-600">담당자: {request.contact_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      발송완료
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">희망 지하철역</p>
                    <p className="font-medium">{request.desired_subway}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">실사용 인원</p>
                    <p className="font-medium">{request.actual_users}명</p>
                  </div>
                  <div>
                    <p className="text-gray-500">입주 예정일</p>
                    <p className="font-medium">
                      {formatDate(request.move_in_date)} ({getMoveInPeriodText(request.move_in_period)})
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">발송 브랜드</p>
                    <p className="font-medium">{request.selected_brands?.length || 0}개</p>
                  </div>
                </div>

                {request.additional_info && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">{request.additional_info}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProposalRequestList;
