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

        // 발송 전 확인
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

    // 브랜드 검색 필터링
    const filteredBrands = brands.filter(brand => {
        if (!brandSearchQuery) return true;
        return brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase());
    });

    const getStatusBadge = (status) => {
        const badges = {
            sending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '발송 중' },
            sent: { bg: 'bg-green-100', text: 'text-green-800', label: '발송 완료' },
            failed: { bg: 'bg-red-100', text: 'text-red-800', label: '발송 실패' }
        };

        const badge = badges[status] || badges.sent;
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
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
                <div className="p-8 text-center">로딩 중...</div>
            </Layout>
        );
    }

    if (error || !request) {
        return (
            <Layout>
                <div className="p-8 text-center text-red-500">{error || '제안 요청을 찾을 수 없습니다'}</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/requests')}
                        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        목록으로 돌아가기
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-2xl font-bold text-gray-900">{request.company_name}</h1>
                                {getStatusBadge(request.send_status)}
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                                생성일: {new Date(request.created_at).toLocaleDateString('ko-KR')}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddBrandsModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            브랜드 추가 요청
                        </button>
                    </div>
                </div>

                {/* 상세 정보 */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {/* 고객사 정보 */}
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">고객사 정보</h2>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">고객사명</dt>
                                <dd className="mt-1 text-sm text-gray-900">{request.company_name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">담당자</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {request.contact_name} {request.contact_position && `(${request.contact_position})`}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">연락처</dt>
                                <dd className="mt-1 text-sm text-gray-900">{request.contact_phone}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">이메일</dt>
                                <dd className="mt-1 text-sm text-gray-900">{request.contact_email}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* 요구사항 */}
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">요구사항</h2>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">희망 지하철역</dt>
                                <dd className="mt-1 text-sm text-gray-900">{request.preferred_subway}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">실사용 인원</dt>
                                <dd className="mt-1 text-sm text-gray-900">{request.actual_users}명</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">희망 인실</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {request.preferred_capacity ? `${request.preferred_capacity}명` : '미정'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">입주 예정일</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(request.move_in_date).toLocaleDateString('ko-KR')} ({request.move_in_period})
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">임대 기간</dt>
                                <dd className="mt-1 text-sm text-gray-900">{request.lease_period}개월</dd>
                            </div>
                            {request.additional_info && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">추가 정보</dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{request.additional_info}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* 발송 이력 */}
                    <div className="p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">발송 이력</h2>
                        {request.send_histories && request.send_histories.length > 0 ? (
                            <div className="space-y-3">
                                {request.send_histories.map((history) => (
                                    <div
                                        key={history._id || history.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {history.brand?.name || '브랜드 정보 없음'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {getSendTypeBadge(history.send_type)} · {new Date(history.sent_at).toLocaleString('ko-KR')}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            발송 완료
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">발송 이력이 없습니다</p>
                        )}
                    </div>
                </div>

                {/* 브랜드 추가 모달 */}
                {showAddBrandsModal && (
                    <div className="fixed z-50 inset-0 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
                                setShowAddBrandsModal(false);
                                setSelectedNewBrands([]);
                                setBrandSearchQuery('');
                            }}></div>
                            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">브랜드 추가 선택</h3>

                                    {/* 검색 입력 */}
                                    <div className="mb-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="브랜드명 검색..."
                                                value={brandSearchQuery}
                                                onChange={(e) => setBrandSearchQuery(e.target.value)}
                                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <svg
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        {selectedNewBrands.length > 0 && (
                                            <p className="text-sm text-blue-600 mt-2">
                                                {selectedNewBrands.length}개 브랜드 선택됨
                                            </p>
                                        )}
                                    </div>

                                    <div className="max-h-80 overflow-y-auto border rounded-lg">
                                        <div className="space-y-1 p-2">
                                            {filteredBrands.length > 0 ? (
                                                filteredBrands.map(brand => (
                                                    <label
                                                        key={brand._id || brand.id}
                                                        className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
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
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <span className="ml-3 text-sm text-gray-900">{brand.name}</span>
                                                    </label>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 text-center py-4">
                                                    검색 결과가 없습니다
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={handleAddBrands}
                                        disabled={addBrandLoading || selectedNewBrands.length === 0}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        {addBrandLoading ? '발송 중...' : '추가 요청 발송'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddBrandsModal(false);
                                            setSelectedNewBrands([]);
                                            setBrandSearchQuery('');
                                        }}
                                        disabled={addBrandLoading}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        취소
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
