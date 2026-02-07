import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { proposalRequestAPI } from '../../services/api';

const ProposalRequestList = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;

            const response = await proposalRequestAPI.getAll(params);
            setRequests(response.data.requests || []);
        } catch (err) {
            console.error('제안 요청 목록 조회 실패:', err);
            setError('제안 요청 목록을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            sending: { cls: 'bg-yellow-100 text-yellow-700', label: '발송 중' },
            sent: { cls: 'bg-green-100 text-green-700', label: '발송 완료' },
            failed: { cls: 'bg-red-100 text-red-700', label: '발송 실패' }
        };
        const badge = badges[status] || badges.sent;
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-3"></div>
                        <p className="text-sm text-gray-500">로딩 중...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="p-6 sm:p-8 text-center text-red-500">{error}</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* 헤더 */}
                <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">제안 요청 목록</h1>
                        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500">
                            브랜드에 발송한 제안 요청을 관리합니다
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/requests/create')}
                        className="w-full sm:w-auto px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium text-sm"
                    >
                        새 제안 요청
                    </button>
                </div>

                {/* 필터 */}
                <div className="mb-4 sm:mb-6">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition"
                    >
                        <option value="">전체 상태</option>
                        <option value="sending">발송 중</option>
                        <option value="sent">발송 완료</option>
                        <option value="failed">발송 실패</option>
                    </select>
                </div>

                {/* 목록 */}
                {requests.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 sm:p-12">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">제안 요청 없음</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mb-4">새로운 제안 요청을 생성해보세요</p>
                            <button
                                onClick={() => navigate('/requests/create')}
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium text-sm"
                            >
                                새 제안 요청
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 sm:space-y-3">
                        {requests.map((request) => (
                            <div
                                key={request._id || request.id}
                                className="bg-white rounded-xl border border-gray-200 shadow-card p-3 sm:p-5 hover:shadow-card-hover cursor-pointer transition-all"
                                onClick={() => navigate(`/requests/${request.id || request._id}`)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                                                {request.company_name}
                                            </h3>
                                            {getStatusBadge(request.send_status)}
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500">
                                            <div>
                                                <span className="text-gray-400">담당자</span> {request.contact_name}
                                            </div>
                                            <div>
                                                <span className="text-gray-400">희망역</span> {request.preferred_subway}
                                            </div>
                                            <div>
                                                <span className="text-gray-400">인원</span> {request.actual_users}명
                                            </div>
                                            <div>
                                                <span className="text-gray-400">임대</span> {request.lease_period}개월
                                            </div>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                                            <span>브랜드 {request.send_histories?.length || request.selected_brands?.length || 0}개</span>
                                            <span>{new Date(request.created_at).toLocaleDateString('ko-KR')}</span>
                                        </div>
                                    </div>
                                    <svg className="h-5 w-5 text-gray-300 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ProposalRequestList;
