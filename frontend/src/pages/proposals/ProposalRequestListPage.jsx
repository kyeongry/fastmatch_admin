import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { proposalRequestAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const ProposalRequestListPage = () => {
    const navigate = useNavigate();
    const { error } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await proposalRequestAPI.getAll();
            setRequests(response.data.data || response.data.proposalRequests || []);
        } catch (err) {
            console.error('제안 요청 목록 조회 실패:', err);
            error('제안 요청 목록을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            sending: 'bg-yellow-100 text-yellow-800',
            sent: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
        };
        const labels = {
            sending: '발송중',
            sent: '발송완료',
            failed: '발송실패',
        };
        return (
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto p-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">제안 요청 관리</h1>
                    <button
                        onClick={() => navigate('/proposals/request')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        + 새 제안 요청
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-4xl mb-4">📝</div>
                        <p className="text-gray-600 mb-4">제안 요청 내역이 없습니다</p>
                        <button
                            onClick={() => navigate('/proposals/request')}
                            className="text-blue-600 hover:underline font-medium"
                        >
                            첫 번째 제안 요청을 보내보세요
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">요청일</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">고객사</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">담당자</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">상태</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(req.created_at)}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{req.company_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{req.contact_name}</td>
                                        <td className="px-6 py-4">{getStatusBadge(req.send_status)}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => navigate(`/proposals/requests/${req.id}`)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                상세보기
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ProposalRequestListPage;
