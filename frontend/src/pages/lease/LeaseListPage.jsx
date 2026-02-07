import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { contractAPI } from '../../services/leaseApi';

const LeaseListPage = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | draft | completed

  useEffect(() => {
    fetchContracts();
  }, [filter]);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await contractAPI.getAll(params);
      setContracts(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || '계약서 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await contractAPI.delete(id);
      setContracts((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || '삭제에 실패했습니다');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
    };
    const labels = {
      draft: '작성중',
      completed: '완료',
      canceled: '취소',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">임대차 계약서</h1>
          <p className="text-gray-600 mt-1">비주거용 건축물 임대차 계약서 관리</p>
        </div>
        <Link
          to="/lease/create"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          + 새 계약서 작성
        </Link>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'all', label: '전체' },
          { value: 'draft', label: '작성중' },
          { value: 'completed', label: '완료' },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === item.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-600">불러오는 중...</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">작성된 계약서가 없습니다</p>
          <Link
            to="/lease/create"
            className="inline-block mt-4 text-primary-600 hover:underline"
          >
            새 계약서 작성하기
          </Link>
        </div>
      ) : (
        /* 계약서 목록 */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  계약번호
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  물건주소
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  임대인
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  임차인
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                  보증금
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  상태
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  작성일
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contracts.map((contract) => (
                <tr key={contract._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/lease/${contract._id}`}
                      className="text-primary-600 hover:underline font-mono text-sm"
                    >
                      {contract.contractNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                    {contract.property?.address || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {contract.parties?.lessors?.[0]?.name || '-'}
                    {contract.parties?.lessors?.length > 1 &&
                      ` 외 ${contract.parties.lessors.length - 1}인`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {contract.parties?.lessees?.[0]?.name || '-'}
                    {contract.parties?.lessees?.length > 1 &&
                      ` 외 ${contract.parties.lessees.length - 1}인`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(contract.terms?.deposit)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(contract.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-center">
                    {formatDate(contract.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      {contract.status === 'draft' && (
                        <Link
                          to={`/lease/edit/${contract._id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          수정
                        </Link>
                      )}
                      {contract.pdfUrl && (
                        <a
                          href={contract.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          PDF
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(contract._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaseListPage;
