import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import OptionCard from '../components/main/OptionCard';
import OptionDetailSlide from '../components/main/OptionDetailSlide';
import OptionRegisterModal from '../components/main/OptionRegisterModal';
import { Modal, Button } from '../components/common';
import { optionAPI } from '../services/api';
import { useToast } from '../hooks/useToast';

const MyOptionsPage = () => {
    const navigate = useNavigate();
    const { success, error, warning } = useToast();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [deletingOptionId, setDeletingOptionId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 상세 보기 상태
    const [detailSlideOpen, setDetailSlideOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);

    // 수정 모달 상태
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingOption, setEditingOption] = useState(null);

    useEffect(() => {
        fetchMyOptions();
    }, []);

    const fetchMyOptions = async () => {
        try {
            const response = await optionAPI.getMy();
            const optionsArray = response.data?.options || response.data?.data || [];
            setOptions(Array.isArray(optionsArray) ? optionsArray : []);
        } catch (err) {
            console.error('내 옵션 조회 실패:', err);
            error('옵션 목록을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (option) => {
        setEditingOption(option);
        setEditModalOpen(true);
    };

    const handleView = (option) => {
        setSelectedOption(option);
        setDetailSlideOpen(true);
    };

    const handleDeleteRequest = (optionId) => {
        if (deleteModalOpen || isDeleting) return; // 중복 클릭 방지
        setDeletingOptionId(optionId);
        setDeleteModalOpen(true);
    };

    const submitDeleteRequest = async () => {
        if (!deleteReason.trim()) {
            warning('삭제 사유를 입력해주세요');
            return;
        }

        if (isDeleting) return; // 중복 클릭 방지

        setIsDeleting(true);
        try {
            await optionAPI.requestDelete(deletingOptionId, { reason: deleteReason });
            success('삭제 요청이 완료되었습니다');
            setDeleteModalOpen(false);
            setDeleteReason('');
            // 목록을 새로고침하여 "삭제요청중" 상태로 표시
            fetchMyOptions();
        } catch (err) {
            console.error('삭제 요청 실패:', err);
            error('삭제 요청에 실패했습니다');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleComplete = async (optionId) => {
        if (!window.confirm('이 옵션을 거래완료 처리하시겠습니까?\n거래완료 처리 후에는 수정할 수 없습니다.')) {
            return;
        }

        try {
            await optionAPI.complete(optionId);
            success('거래가 완료되었습니다');
            fetchMyOptions(); // 목록 새로고침
        } catch (err) {
            console.error('거래완료 처리 실패:', err);
            error(err.response?.data?.message || '거래완료 처리에 실패했습니다');
        }
    };

    const handleReactivate = async (optionId) => {
        if (!window.confirm('이 옵션을 거래재개 처리하시겠습니까?')) {
            return;
        }

        try {
            await optionAPI.reactivate(optionId);
            success('거래가 재개되었습니다');
            fetchMyOptions(); // 목록 새로고침
        } catch (err) {
            console.error('거래재개 처리 실패:', err);
            error(err.response?.data?.message || '거래재개 처리에 실패했습니다');
        }
    };

    const handleCancelDeleteRequest = async (optionId) => {
        try {
            await optionAPI.cancelDeleteRequest(optionId);
            success('삭제 요청이 취소되었습니다');
            fetchMyOptions(); // 목록 새로고침
        } catch (err) {
            console.error('삭제 요청 취소 실패:', err);
            error(err.response?.data?.message || '삭제 요청 취소에 실패했습니다');
        }
    };

    return (
        <Layout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">내가 등록한 옵션</h1>
                    <button
                        onClick={() => navigate('/options/register')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        + 새 옵션 등록
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : options.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-4xl mb-4">📭</div>
                        <p className="text-gray-600 mb-4">등록한 옵션이 없습니다</p>
                        <button
                            onClick={() => navigate('/options/register')}
                            className="text-blue-600 hover:underline font-medium"
                        >
                            첫 번째 옵션을 등록해보세요
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {options.map((option) => (
                            <OptionCard
                                key={option.id}
                                option={option}
                                selected={false}
                                onSelect={() => { }}
                                onView={() => handleView(option)}
                                onEdit={() => handleEdit(option)}
                                onDelete={() => handleDeleteRequest(option.id)}
                                onComplete={() => handleComplete(option.id)}
                                onReactivate={() => handleReactivate(option.id)}
                            />
                        ))}
                    </div>
                )}
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
                onUpdate={fetchMyOptions}
            />

            {/* 옵션 수정 모달 */}
            <OptionRegisterModal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setEditingOption(null);
                }}
                onSuccess={() => {
                    fetchMyOptions();
                    setEditModalOpen(false);
                    setEditingOption(null);
                }}
                initialData={editingOption}
            />
        </Layout >
    );
};

export default MyOptionsPage;
