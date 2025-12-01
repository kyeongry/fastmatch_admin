import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useToast } from '../../hooks/useToast';
import { optionAPI, proposalDocumentAPI } from '../../services/api';

const ProposalCreate = () => {
    const navigate = useNavigate();
    const { error, success } = useToast();
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [proposalName, setProposalName] = useState('');
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const dragRef = useRef(null);

    useEffect(() => {
        loadSelectedOptions();
    }, []);

    const loadSelectedOptions = async () => {
        try {
            const stored = localStorage.getItem('selectedOptionsForProposal');
            if (!stored) {
                error('선택된 옵션이 없습니다');
                navigate('/');
                return;
            }

            const optionIds = JSON.parse(stored);
            if (optionIds.length === 0) {
                error('선택된 옵션이 없습니다');
                navigate('/');
                return;
            }

            // 옵션 상세 정보 조회
            const promises = optionIds.map(id => optionAPI.getById(id));
            const responses = await Promise.all(promises);
            const options = responses.map(res => res.data.data || res.data.option);

            setSelectedOptions(options);
            const now = new Date();
            const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            setProposalName(`공유오피스_제안서_${dateStr}`);
        } catch (err) {
            console.error('옵션 로드 실패:', err);
            error('옵션 정보를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    // 드래그 시작
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        dragRef.current = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
        // 드래그 중인 요소 스타일
        setTimeout(() => {
            e.target.style.opacity = '0.5';
        }, 0);
    };

    // 드래그 종료
    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // 드래그 오버
    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    // 드롭
    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = dragRef.current;

        if (dragIndex === null || dragIndex === dropIndex) {
            setDragOverIndex(null);
            return;
        }

        const newOptions = [...selectedOptions];
        const draggedItem = newOptions[dragIndex];
        newOptions.splice(dragIndex, 1);
        newOptions.splice(dropIndex, 0, draggedItem);

        setSelectedOptions(newOptions);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // 정렬 함수
    const handleSort = (sortBy) => {
        const sorted = [...selectedOptions].sort((a, b) => {
            if (sortBy === 'monthly_fee_asc') {
                return (a.monthly_fee || 0) - (b.monthly_fee || 0);
            } else if (sortBy === 'monthly_fee_desc') {
                return (b.monthly_fee || 0) - (a.monthly_fee || 0);
            } else if (sortBy === 'capacity_asc') {
                return (a.capacity || 0) - (b.capacity || 0);
            } else if (sortBy === 'capacity_desc') {
                return (b.capacity || 0) - (a.capacity || 0);
            }
            return 0;
        });
        setSelectedOptions(sorted);
    };

    // 옵션 삭제
    const handleRemoveOption = (index) => {
        const newOptions = selectedOptions.filter((_, i) => i !== index);
        setSelectedOptions(newOptions);
    };

    const handleCreate = async () => {
        if (selectedOptions.length === 0) {
            error('최소 1개 이상의 옵션을 선택해주세요');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                document_name: proposalName,
                selected_options: selectedOptions.map(opt => opt.id || opt._id),
            };

            // 1. 제안서 문서 생성 (MongoDB에 저장)
            const response = await proposalDocumentAPI.create(payload);
            const createdProposal = response.data.document;

            success('제안서가 생성되었습니다');

            // 2. 백엔드 API를 통해 PDF 생성 및 다운로드 (Blob 응답)
            const pdfResponse = await proposalDocumentAPI.generatePDF(createdProposal.id || createdProposal._id);

            // 파일명 생성 (제안서 제목 기반)
            const safeFileName = proposalName
                .replace(/[<>:"/\\|?*]/g, '_') // 파일명에 사용 불가능한 문자 제거
                .replace(/\s+/g, '_') // 공백을 언더스코어로
                .substring(0, 100); // 최대 100자

            // Blob 데이터를 다운로드 링크로 변환
            const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${safeFileName}.pdf`);
            document.body.appendChild(link);
            link.click();

            // 정리
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            // 3. localStorage 정리
            localStorage.removeItem('selectedOptionsForProposal');

            // 4. 제안서 목록 페이지로 이동
            setTimeout(() => {
                navigate('/proposals');
            }, 1000);

        } catch (err) {
            console.error('제안서 생성 실패:', err);
            error('제안서 생성에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto p-8">
                <h1 className="text-2xl font-bold mb-6">제안서 생성</h1>

                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        제안서 제목
                    </label>
                    <input
                        type="text"
                        value={proposalName}
                        onChange={(e) => setProposalName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">선택된 옵션 ({selectedOptions.length})</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">정렬:</span>
                            <select
                                onChange={(e) => e.target.value && handleSort(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                defaultValue=""
                            >
                                <option value="" disabled>정렬 기준</option>
                                <option value="monthly_fee_asc">월사용료 낮은순</option>
                                <option value="monthly_fee_desc">월사용료 높은순</option>
                                <option value="capacity_asc">인실수 적은순</option>
                                <option value="capacity_desc">인실수 많은순</option>
                            </select>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500">
                        핸들을 드래그하여 옵션 순서를 변경할 수 있습니다.
                    </p>

                    {selectedOptions.map((option, index) => (
                        <div
                            key={option.id || option._id || index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`bg-white border rounded-lg p-4 flex items-center gap-4 shadow-sm transition-all ${
                                dragOverIndex === index
                                    ? 'border-blue-500 border-2 bg-blue-50'
                                    : 'border-gray-200'
                            } ${draggedIndex === index ? 'opacity-50' : ''}`}
                        >
                            {/* 드래그 핸들 */}
                            <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                            </div>

                            {/* 순서 번호 */}
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shrink-0">
                                {index + 1}
                            </div>

                            {/* 옵션 정보 */}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                    {option.branch?.brand?.name} {option.branch?.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {option.capacity}인실 | {option.category1 && (
                                        <>
                                            {option.category1 === 'exclusive_floor' && '전용층'}
                                            {option.category1 === 'separate_floor' && '분리층'}
                                            {option.category1 === 'connected_floor' && '연층'}
                                            {option.category1 === 'exclusive_room' && '전용호실'}
                                            {option.category1 === 'separate_room' && '분리호실'}
                                            {option.category1 === 'connected_room' && '연접호실'}
                                        </>
                                    )}
                                    {option.category2 && (
                                        <>
                                            {' / '}
                                            {option.category2 === 'window_side' && '창측'}
                                            {option.category2 === 'inner_side' && '내측'}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 가격 */}
                            <div className="text-right shrink-0">
                                <div className="font-semibold text-blue-600">
                                    {new Intl.NumberFormat('ko-KR').format(option.monthly_fee)}원/월
                                </div>
                                <div className="text-xs text-gray-500">
                                    보증금 {new Intl.NumberFormat('ko-KR').format(option.deposit || 0)}원
                                </div>
                            </div>

                            {/* 삭제 버튼 */}
                            <button
                                onClick={() => handleRemoveOption(index)}
                                className="text-gray-400 hover:text-red-500 transition shrink-0"
                                title="옵션 제거"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {selectedOptions.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            선택된 옵션이 없습니다.
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading || selectedOptions.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'PDF 생성 중...' : '제안서 생성하기'}
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default ProposalCreate;
