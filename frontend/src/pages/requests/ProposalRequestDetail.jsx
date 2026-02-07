import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { proposalRequestAPI, brandAPI } from '../../services/api';

const ProposalRequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddBrandsModal, setShowAddBrandsModal] = useState(false);
    const [brands, setBrands] = useState([]);
    const [selectedNewBrands, setSelectedNewBrands] = useState([]);
    const [addBrandLoading, setAddBrandLoading] = useState(false);
    const [brandSearchQuery, setBrandSearchQuery] = useState('');

    useEffect(() => {
        fetchRequest();
        fetchBrands();
    }, [id]);

    const fetchRequest = async () => {
        try {
            setLoading(true);
            const response = await proposalRequestAPI.getById(id);
            setRequest(response.data.request);
        } catch (err) {
            console.error('제안 요청 조회 실패:', err);
            setError('제안 요청을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await brandAPI.getAll();
            setBrands(response.data.brands || response.data || []);
        } catch (error) {
            console.error('브랜드 조회 실패:', error);
        }
    };

    const handleAddBrands = async () => {
        if (selectedNewBrands.length === 0) {
            alert('추가할 브랜드를 선택해주세요');
            return;
        }

        const selectedBrandNames = brands
            .filter(b => selectedNewBrands.includes(b._id?.toString() || b.id))
            .map(b => b.name)
            .join(', ');

        if (!window.confirm(`선택한 브랜드(${selectedBrandNames})에 추가 제안 요청을 발송하시겠습니까?`)) {
            return;
        }

        setAddBrandLoading(true);
        try {
            await proposalRequestAPI.addBrands(id, { additional_brands: selectedNewBrands });
            alert('추가 제안 요청이 발송되었습니다');
            setShowAddBrandsModal(false);
            setSelectedNewBrands([]);
            setBrandSearchQuery('');
            fetchRequest();
        } catch (error) {
            console.error('추가 제안 요청 실패:', error);
            alert('추가 제안 요청 발송에 실패했습니다');
        } finally {
            setAddBrandLoading(false);
        }
    };

    const filteredBrands = brands.filter(brand => {
        if (!brandSearchQuery) return true;
        return brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase());
    });

    const getStatusBadge = (status) => {
        const badges = {
            sending: { cls: 'bg-yellow-100 text-yellow-700', label: '발송 중' },
            sent: { cls: 'bg-green-100 text-green-700', label: '발송 완료' },
            failed: { cls: 'bg-red-100 text-red-700', label: '발송 실패' }
        };
        const badge = badges[status] || badges.sent;
        return (
            <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${badge.cls}`}>
                {badge.label}
            </span>
        );
    };

    const getSendTypeBadge = (type) => {
        const types = {
            initial: '초기 요청',
            additional: '추가 요청',
            modified: '수정 요청'
        };
        return types[type] || type;
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

    if (error || !request) {
        return (
            <Layout>
                <div className="p-6 sm:p-8 text-center text-red-500">{error || '제안 요청을 찾을 수 없습니다'}</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* 헤더 */}
                <div className="mb-4 sm:mb-6">
                    <button
                        onClick={() => navigate('/requests')}
                        className="text-primary-600 hover:text-primary-700 mb-3 sm:mb-4 flex items-center text-sm font-medium"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        목록으로
                    </button>
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-start">
                        <div>
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{request.company_name}</h1>
                                {getStatusBadge(request.send_status)}
                            </div>
                            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
                                생성일: {new Date(request.created_at).toLocaleDateString('ko-KR')}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddBrandsModal(true)}
                            className="w-full sm:w-auto px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium text-sm"
                        >
                            브랜드 추가 요청
                        </button>
                    </div>
                </div>

                {/* 상세 정보 카드들 */}
                <div className="space-y-3 sm:space-y-4">
                    {/* 고객사 정보 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-sm sm:text-base font-bold text-gray-900">고객사 정보</h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            <dl className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-xs sm:text-sm text-gray-500">고객사명</dt>
                                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{request.company_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs sm:text-sm text-gray-500">담당자</dt>
                                    <dd className="mt-0.5 text-sm font-medium text-gray-900">
                                        {request.contact_name} {request.contact_position && `(${request.contact_position})`}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs sm:text-sm text-gray-500">연락처</dt>
                                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{request.contact_phone}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs sm:text-sm text-gray-500">이메일</dt>
                                    <dd className="mt-0.5 text-sm font-medium text-gray-900 break-all">{request.contact_email}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* 요구사항 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-sm sm:text-base font-bold text-gray-900">요구사항</h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            <dl className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-xs sm:text-sm text-gray-500">희망 지하철역</dt>
                                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{request.preferred_subway}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs sm:text-sm text-gray-500">실사용 인원</dt>
                                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{request.actual_users}명</dd>
                                </div>
                                <div>
                                    <dt className="text-xs sm:text-sm text-gray-500">희망 인실</dt>
                                    <dd className="mt-0.5 text-sm font-medium text-gray-900">
                                        {request.preferred_capacity ? `${request.preferred_capacity}명` : '미정'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs sm:text-sm text-gray-500">입주 예정일</dt>
                                    <dd className="mt-0.5 text-sm font-medium text-gray-900">
                                        {new Date(request.move_in_date).toLocaleDateString('ko-KR')}
                                        <span className="text-gray-500 text-xs ml-1">({request.move_in_period})</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs sm:text-sm text-gray-500">임대 기간</dt>
                                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{request.lease_period}개월</dd>
                                </div>
                                {request.additional_info && (
                                    <div className="col-span-2">
                                        <dt className="text-xs sm:text-sm text-gray-500">추가 정보</dt>
                                        <dd className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 mt-1">{request.additional_info}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>

                    {/* 발송 이력 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-sm sm:text-base font-bold text-gray-900">발송 이력</h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            {request.send_histories && request.send_histories.length > 0 ? (
                                <div className="space-y-2 sm:space-y-3">
                                    {request.send_histories.map((history) => (
                                        <div
                                            key={history._id || history.id}
                                            className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {history.brand?.name || '브랜드 정보 없음'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {getSendTypeBadge(history.send_type)} · {new Date(history.sent_at).toLocaleString('ko-KR')}
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex-shrink-0 ml-2">
                                                발송 완료
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-4">발송 이력이 없습니다</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 브랜드 추가 모달 */}
                {showAddBrandsModal && (
                    <div className="fixed z-[100] inset-0 overflow-y-auto">
                        <div className="flex items-end sm:items-center justify-center min-h-screen px-0 sm:px-4 pt-4 pb-0 sm:pb-20 text-center">
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" onClick={() => {
                                setShowAddBrandsModal(false);
                                setSelectedNewBrands([]);
                                setBrandSearchQuery('');
                            }}></div>
                            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl text-left overflow-hidden shadow-modal w-full sm:max-w-lg animate-fadeIn">
                                {/* 모바일 드래그 핸들 */}
                                <div className="sm:hidden flex justify-center pt-2">
                                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                                </div>
                                <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">브랜드 추가 선택</h3>

                                    <div className="mb-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="브랜드명 검색..."
                                                value={brandSearchQuery}
                                                onChange={(e) => setBrandSearchQuery(e.target.value)}
                                                className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                            />
                                            <svg
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        {selectedNewBrands.length > 0 && (
                                            <p className="text-xs sm:text-sm text-primary-600 mt-2 font-medium">
                                                {selectedNewBrands.length}개 브랜드 선택됨
                                            </p>
                                        )}
                                    </div>

                                    <div className="max-h-60 sm:max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                                        <div className="space-y-1 p-2">
                                            {filteredBrands.length > 0 ? (
                                                filteredBrands.map(brand => (
                                                    <label
                                                        key={brand._id || brand.id}
                                                        className="flex items-center p-3 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedNewBrands.includes(brand._id?.toString() || brand.id)}
                                                            onChange={(e) => {
                                                                const brandId = brand._id?.toString() || brand.id;
                                                                if (e.target.checked) {
                                                                    setSelectedNewBrands([...selectedNewBrands, brandId]);
                                                                } else {
                                                                    setSelectedNewBrands(selectedNewBrands.filter(id => id !== brandId));
                                                                }
                                                            }}
                                                            className="h-4 w-4 border-gray-300 rounded"
                                                        />
                                                        <span className="ml-3 text-sm text-gray-900">{brand.name}</span>
                                                    </label>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-400 text-center py-4">
                                                    검색 결과가 없습니다
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 safe-area-bottom">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddBrandsModal(false);
                                            setSelectedNewBrands([]);
                                            setBrandSearchQuery('');
                                        }}
                                        disabled={addBrandLoading}
                                        className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddBrands}
                                        disabled={addBrandLoading || selectedNewBrands.length === 0}
                                        className="w-full sm:w-auto px-4 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                                    >
                                        {addBrandLoading ? '발송 중...' : '추가 요청 발송'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ProposalRequestDetail;
