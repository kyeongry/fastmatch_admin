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
            sending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '발송 중' },
            sent: { bg: 'bg-green-100', text: 'text-green-800', label: '발송 완료' },
            failed: { bg: 'bg-red-100', text: 'text-red-800', label: '발송 실패' }
        };

        const badge = badges[status] || badges.sent;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="p-8 text-center">로딩 중...</div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="p-8 text-center text-red-500">{error}</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">제안 요청 목록</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            브랜드에 발송한 제안 요청을 관리합니다
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/requests/create')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        새 제안 요청
                    </button>
                </div>

                {/* 필터 */}
                <div className="mb-6">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">전체 상태</option>
                        <option value="sending">발송 중</option>
                        <option value="sent">발송 완료</option>
                        <option value="failed">발송 실패</option>
                    </select>
                </div>

                {/* 목록 */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    {requests.length === 0 ? (
                        <div className="text-center py-12">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">제안 요청 없음</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                새로운 제안 요청을 생성해보세요
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => navigate('/requests/create')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    새 제안 요청
                                </button>
                            </div>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {requests.map((request) => (
                                <li
                                    key={request._id || request.id}
                                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/requests/${request.id || request._id}`)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="text-lg font-medium text-blue-600 truncate">
                                                    {request.company_name}
                                                </h3>
                                                {getStatusBadge(request.send_status)}
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-500">
                                                <div>
                                                    <span className="font-medium">담당자:</span> {request.contact_name}
                                                </div>
                                                <div>
                                                    <span className="font-medium">희망역:</span> {request.preferred_subway}
                                                </div>
                                                <div>
                                                    <span className="font-medium">실사용 인원:</span> {request.actual_users}명
                                                </div>
                                                <div>
                                                    <span className="font-medium">임대 기간:</span> {request.lease_period}개월
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-500">
                                                <span className="font-medium">발송 브랜드:</span>{' '}
                                                {request.send_histories?.length || request.selected_brands?.length || 0}개
                                            </div>
                                            <div className="mt-1 text-xs text-gray-400">
                                                생성일: {new Date(request.created_at).toLocaleDateString('ko-KR')}
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <svg
                                                className="h-5 w-5 text-gray-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ProposalRequestList;
