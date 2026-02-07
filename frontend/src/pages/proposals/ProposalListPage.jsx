import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { proposalDocumentAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const ProposalListPage = () => {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pdfGenerating, setPdfGenerating] = useState({});
    const [deleting, setDeleting] = useState({});
    const navigate = useNavigate();
    const { error: showError, success: showSuccess } = useToast();

    // 페이지네이션 상태
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchProposals();
    }, [page, pageSize]);

    const fetchProposals = async () => {
        try {
            setLoading(true);
            const response = await proposalDocumentAPI.getAll({ page, pageSize });
            setProposals(response.data?.documents || []);
            setTotal(response.data?.total || 0);
        } catch (err) {
            console.error('Failed to fetch proposals:', err);
            showError('제안서 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 남은 일수 계산
    const getDaysUntilDeletion = (createdAt) => {
        const created = new Date(createdAt);
        const deleteDate = new Date(created);
        deleteDate.setDate(deleteDate.getDate() + 30);
        const now = new Date();
        const diffTime = deleteDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // PDF 생성 및 다운로드
    const handleGeneratePDF = async (proposalId, proposalName) => {
        try {
            setPdfGenerating(prev => ({ ...prev, [proposalId]: true }));

            const response = await proposalDocumentAPI.generatePDF(proposalId, false);

            // 파일명 생성 (제안서 제목 기반)
            const safeFileName = proposalName
                .replace(/[<>:"/\\|?*]/g, '_')
                .replace(/\s+/g, '_')
                .substring(0, 100);

            // Blob 데이터를 다운로드 링크로 변환
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${safeFileName}.pdf`);
            document.body.appendChild(link);
            link.click();

            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            showSuccess('PDF가 다운로드되었습니다.');
        } catch (err) {
            console.error('PDF 생성 실패:', err);
            showError('PDF 생성에 실패했습니다.');
        } finally {
            setPdfGenerating(prev => ({ ...prev, [proposalId]: false }));
        }
    };

    // 제안서 삭제
    const handleDelete = async (proposalId) => {
        if (!window.confirm('정말 이 제안서를 삭제하시겠습니까?')) {
            return;
        }

        try {
            setDeleting(prev => ({ ...prev, [proposalId]: true }));
            await proposalDocumentAPI.delete(proposalId);
            showSuccess('제안서가 삭제되었습니다.');
            fetchProposals();
        } catch (err) {
            console.error('제안서 삭제 실패:', err);
            showError('제안서 삭제에 실패했습니다.');
        } finally {
            setDeleting(prev => ({ ...prev, [proposalId]: false }));
        }
    };

    // 총 페이지 수
    const totalPages = Math.ceil(total / pageSize);

    // 페이지 번호 배열 생성
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">내 제안서 목록</h1>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
                    >
                        새 제안서 작성
                    </button>
                </div>

                {/* 안내 메시지 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-sm text-amber-800 font-medium">
                                제안서 자동 삭제 안내
                            </p>
                            <p className="text-sm text-amber-700 mt-1">
                                생성일로부터 30일이 지난 제안서는 자동으로 삭제됩니다.
                                필요한 제안서는 PDF로 다운로드하여 보관해주세요.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 페이지 크기 선택 */}
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500">
                        총 {total}개의 제안서
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">표시:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                            <option value={10}>10개</option>
                            <option value={20}>20개</option>
                            <option value={50}>50개</option>
                            <option value={100}>100개</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white shadow overflow-hidden rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            제안서명
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            옵션 수
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            생성일
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            삭제 예정
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            작업
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {proposals.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                생성된 제안서가 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        proposals.map((proposal) => {
                                            const daysLeft = getDaysUntilDeletion(proposal.created_at);
                                            const isUrgent = daysLeft <= 7;

                                            return (
                                                <tr key={proposal._id || proposal.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {proposal.document_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {proposal.options?.length || proposal.selected_options?.length || 0}개
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(proposal.created_at).toLocaleDateString('ko-KR', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {daysLeft > 0 ? (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                isUrgent
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {isUrgent && (
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                                {daysLeft}일 후
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                삭제 예정
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleGeneratePDF(proposal.id || proposal._id, proposal.document_name)}
                                                                disabled={pdfGenerating[proposal.id || proposal._id]}
                                                                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition ${
                                                                    pdfGenerating[proposal.id || proposal._id]
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                                }`}
                                                            >
                                                                {pdfGenerating[proposal.id || proposal._id] ? (
                                                                    <>
                                                                        <svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        생성중
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                        PDF
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(proposal.id || proposal._id)}
                                                                disabled={deleting[proposal.id || proposal._id]}
                                                                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition ${
                                                                    deleting[proposal.id || proposal._id]
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                                                                }`}
                                                            >
                                                                {deleting[proposal.id || proposal._id] ? (
                                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-1 mt-6">
                                <button
                                    onClick={() => setPage(1)}
                                    disabled={page === 1}
                                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {getPageNumbers().map(pageNum => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`px-4 py-2 text-sm font-medium border ${
                                            page === pageNum
                                                ? 'bg-primary-500 text-white border-primary-500'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setPage(totalPages)}
                                    disabled={page === totalPages}
                                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default ProposalListPage;
