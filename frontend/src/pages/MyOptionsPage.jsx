import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import SearchBar from '../components/main/SearchBar';
import FilterBar from '../components/main/FilterBar';
import OptionCard from '../components/main/OptionCard';
import OptionListItem from '../components/main/OptionListItem';
import OptionDetailSlide from '../components/main/OptionDetailSlide';
import OptionRegisterModal from '../components/main/OptionRegisterModal';
import Pagination from '../components/common/Pagination';
import { Modal, Button } from '../components/common';
import { optionAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import useAuth from '../hooks/useAuth';
import { useDeepCompareMemo } from '../hooks/useDeepCompare';

const MyOptionsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error, warning } = useToast();

    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalOptions, setTotalOptions] = useState(0);

    // 삭제 모달
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [deletingOptionId, setDeletingOptionId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 상세 보기
    const [detailSlideOpen, setDetailSlideOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);

    // 수정 모달
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingOption, setEditingOption] = useState(null);

    // 거래완료 표시
    const [showCompleted, setShowCompleted] = useState(true);

    // 뷰 모드
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('myOptionViewMode') || 'grid';
    });

    // 페이지네이션
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const saved = localStorage.getItem('myOptionItemsPerPage');
        return saved ? parseInt(saved, 10) : 20;
    });

    // 필터
    const [filters, setFilters] = useState(() => {
        const savedFilters = localStorage.getItem('myOptionFilterState');
        const savedSort = localStorage.getItem('myOptionSortBy');
        if (savedFilters) {
            try {
                const parsed = JSON.parse(savedFilters);
                return {
                    brands: parsed.brands || [],
                    branches: parsed.branches || [],
                    creators: [],
                    categories: parsed.categories || [],
                    search: parsed.search || '',
                    sort: savedSort || parsed.sort || 'latest',
                    minCapacity: parsed.minCapacity || null,
                    maxCapacity: parsed.maxCapacity || null,
                };
            } catch {
                // fallback
            }
        }
        return {
            brands: [],
            branches: [],
            creators: [],
            categories: [],
            search: '',
            sort: savedSort || 'latest',
            minCapacity: null,
            maxCapacity: null,
        };
    });

    const stableBrands = useDeepCompareMemo(filters.brands);
    const stableBranches = useDeepCompareMemo(filters.branches);
    const stableCategories = useDeepCompareMemo(filters.categories);

    // 필터 저장
    useEffect(() => {
        if (filters) {
            localStorage.setItem('myOptionFilterState', JSON.stringify(filters));
        }
    }, [filters]);

    // 옵션 목록 조회
    useEffect(() => {
        if (user?.id) fetchOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        stableBrands,
        stableBranches,
        stableCategories,
        filters.search,
        filters.sort,
        filters.refresh,
        filters.minCapacity,
        filters.maxCapacity,
        currentPage,
        itemsPerPage,
        user?.id,
    ]);

    // 필터 변경 시 페이지 리셋
    useEffect(() => {
        setCurrentPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        stableBrands,
        stableBranches,
        stableCategories,
        filters.search,
        filters.sort,
        filters.minCapacity,
        filters.maxCapacity,
    ]);

    const fetchOptions = async () => {
        setLoading(true);
        try {
            const params = {
                creator_ids: [user.id],
                ...(filters.brands?.length > 0 && { brand_ids: filters.brands }),
                ...(filters.branches?.length > 0 && { branch_ids: filters.branches }),
                ...(filters.categories?.length > 0 && { category1_list: filters.categories }),
                ...(filters.search && { search: filters.search }),
                ...(filters.minCapacity && { min_capacity: filters.minCapacity }),
                ...(filters.maxCapacity && { max_capacity: filters.maxCapacity }),
                sort: filters.sort || 'latest',
                page: currentPage,
                pageSize: itemsPerPage,
            };

            const response = await optionAPI.getAll(params);
            const optionsArray = response.data?.options || [];
            const total = response.data?.total || 0;
            const validOptions = Array.isArray(optionsArray)
                ? optionsArray.filter((opt) => opt && opt.id)
                : [];
            setOptions(validOptions);
            setTotalOptions(total);
        } catch (err) {
            console.error('내 옵션 조회 실패:', err);
            setOptions([]);
            setTotalOptions(0);
        } finally {
            setLoading(false);
        }
    };

    const handleView = useCallback((option) => {
        setSelectedOption(option);
        setDetailSlideOpen(true);
    }, []);

    const handleEdit = useCallback((option) => {
        setEditingOption(option);
        setEditModalOpen(true);
    }, []);

    const handleDeleteRequest = useCallback((optionId) => {
        setDeletingOptionId(optionId);
        setDeleteModalOpen(true);
    }, []);

    const submitDeleteRequest = async () => {
        if (!deleteReason.trim()) {
            warning('삭제 사유를 입력해주세요');
            return;
        }
        if (isDeleting) return;

        setIsDeleting(true);
        try {
            await optionAPI.requestDelete(deletingOptionId, { reason: deleteReason });
            success('삭제 요청이 완료되었습니다');
            setDeleteModalOpen(false);
            setDeleteReason('');
            await handleDetailUpdate();
        } catch (err) {
            console.error('삭제 요청 실패:', err);
            error(err.response?.data?.message || '삭제 요청에 실패했습니다');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleComplete = async (optionId) => {
        try {
            await optionAPI.complete(optionId);
            success('거래가 완료되었습니다');
            await handleDetailUpdate();
        } catch (err) {
            console.error('거래완료 처리 실패:', err);
            error(err.response?.data?.message || '거래완료 처리에 실패했습니다');
        }
    };

    const handleReactivate = async (optionId) => {
        try {
            await optionAPI.reactivate(optionId);
            success('거래가 재개되었습니다');
            await handleDetailUpdate();
        } catch (err) {
            console.error('거래재개 처리 실패:', err);
            error(err.response?.data?.message || '거래재개 처리에 실패했습니다');
        }
    };

    const handleCancelDeleteRequest = async (optionId) => {
        try {
            await optionAPI.cancelDeleteRequest(optionId);
            success('삭제 요청이 취소되었습니다');
            await handleDetailUpdate();
        } catch (err) {
            console.error('삭제 요청 취소 실패:', err);
            error(err.response?.data?.message || '삭제 요청 취소에 실패했습니다');
        }
    };

    const handleDetailUpdate = async () => {
        await fetchOptions();
        const optionId = selectedOption?.id || selectedOption?._id;
        if (selectedOption && optionId) {
            try {
                const response = await optionAPI.getById(optionId);
                if (response.data?.option) {
                    setSelectedOption(response.data.option);
                }
            } catch (err) {
                console.error('옵션 상세 새로고침 실패:', err);
            }
        }
    };

    const filteredOptions = showCompleted
        ? options
        : options.filter(opt => opt.status !== 'completed');

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        localStorage.setItem('myOptionViewMode', mode);
    };

    const handleItemsPerPageChange = (newSize) => {
        setItemsPerPage(newSize);
        setCurrentPage(1);
        localStorage.setItem('myOptionItemsPerPage', newSize.toString());
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const totalPages = useMemo(() => Math.ceil(totalOptions / itemsPerPage), [totalOptions, itemsPerPage]);

    return (
        <Layout>
            <div className="flex flex-col h-full overflow-hidden bg-gray-50">
                {/* 검색 & 필터 */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="px-3 sm:px-4 md:px-6 pt-3">
                        <SearchBar onSearch={(search) => setFilters({ ...filters, search })} />
                    </div>
                    <FilterBar
                        filters={filters}
                        onFilterChange={setFilters}
                        pageSize={itemsPerPage}
                        onPageSizeChange={handleItemsPerPageChange}
                    />
                </div>

                {/* 메인 콘텐츠 */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto">
                        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                            {/* 헤더 */}
                            <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                                    <div>
                                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">내가 등록한 옵션</h1>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                                            {totalOptions > 0 ? `총 ${totalOptions}개의 옵션` : '등록된 옵션이 없습니다'}
                                        </p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showCompleted}
                                            onChange={(e) => setShowCompleted(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 accent-primary-500"
                                        />
                                        <span className="text-xs sm:text-sm text-gray-700">거래완료 포함</span>
                                    </label>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    {/* 뷰 모드 전환 */}
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => handleViewModeChange('grid')}
                                            className={`p-1.5 sm:p-2 rounded-md transition ${viewMode === 'grid'
                                                ? 'bg-white text-primary-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            title="바둑판 보기"
                                        >
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleViewModeChange('list')}
                                            className={`p-1.5 sm:p-2 rounded-md transition ${viewMode === 'list'
                                                ? 'bg-white text-primary-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            title="목록 보기"
                                        >
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => navigate('/options/register')}
                                        className="flex items-center gap-1.5 sm:gap-2 sm:!px-4 sm:!py-2 sm:!text-sm"
                                    >
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="hidden sm:inline">옵션 등록</span>
                                        <span className="sm:hidden">등록</span>
                                    </Button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                                        <p className="text-gray-600 font-medium">옵션을 불러오는 중...</p>
                                    </div>
                                </div>
                            ) : filteredOptions.length === 0 ? (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 sm:p-12">
                                    <div className="text-center">
                                        <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-2">등록한 옵션이 없습니다</h3>
                                        <p className="text-xs sm:text-sm text-gray-500 mb-4">첫 번째 옵션을 등록해보세요</p>
                                        <Button
                                            variant="primary"
                                            size="md"
                                            onClick={() => navigate('/options/register')}
                                        >
                                            옵션 등록하기
                                        </Button>
                                    </div>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6">
                                    {filteredOptions.map((option) => (
                                        <OptionCard
                                            key={option.id}
                                            option={option}
                                            selected={false}
                                            onSelect={() => { }}
                                            onView={() => handleView(option)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredOptions.map((option) => (
                                        <OptionListItem
                                            key={option.id}
                                            option={option}
                                            selected={false}
                                            onSelect={() => { }}
                                            onView={() => handleView(option)}
                                            onEdit={() => handleEdit(option)}
                                            onDelete={() => handleDeleteRequest(option.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 페이지네이션 */}
                            {totalOptions > 0 && totalPages > 1 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    totalItems={totalOptions}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 삭제 요청 모달 */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDeleteReason('');
                }}
                title="옵션 삭제 요청"
                size="md"
            >
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h4 className="font-medium text-amber-900 mb-1">주의사항</h4>
                                <p className="text-sm text-amber-800">
                                    이 옵션을 삭제하시겠습니까? 관리자의 승인이 필요합니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            삭제 사유 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            placeholder="삭제 사유를 입력해주세요..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            rows={4}
                        />
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t">
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setDeleteReason('');
                            }}
                        >
                            취소
                        </Button>
                        <Button
                            variant="danger"
                            fullWidth
                            onClick={submitDeleteRequest}
                            disabled={!deleteReason.trim() || isDeleting}
                        >
                            {isDeleting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    삭제 요청 중...
                                </span>
                            ) : '삭제 요청'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 옵션 상세 슬라이드 */}
            <OptionDetailSlide
                option={selectedOption}
                isOpen={detailSlideOpen}
                onClose={() => {
                    setDetailSlideOpen(false);
                    setSelectedOption(null);
                }}
                onComplete={handleComplete}
                onReactivate={handleReactivate}
                onCancelDeleteRequest={handleCancelDeleteRequest}
                onDelete={handleDeleteRequest}
                onUpdate={handleDetailUpdate}
            />

            {/* 옵션 수정 모달 */}
            <OptionRegisterModal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setEditingOption(null);
                }}
                onSuccess={() => {
                    fetchOptions();
                    setEditModalOpen(false);
                    setEditingOption(null);
                }}
                initialData={editingOption}
            />
        </Layout>
    );
};

export default MyOptionsPage;
