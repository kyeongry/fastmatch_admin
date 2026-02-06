import { useState, useEffect, useRef, useCallback } from 'react';
import { optionAPI, proposalDocumentAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { formatPrice, formatCategory1, formatContractPeriod } from '../../utils/formatters';

const ProposalCreateSlide = ({
  isOpen,
  onClose,
  selectedOptionIds,
  onRemoveOption,
  onViewOptionDetail,
}) => {
  const { success, error: showError, warning } = useToast();

  // Step management: 1 = option list, 2 = page config
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOptionId, setExpandedOptionId] = useState(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Drag and drop
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const autoScrollRef = useRef(null);

  // Step 2 state
  const [proposalName, setProposalName] = useState('');
  const [showVacancy, setShowVacancy] = useState(false);
  const [pageConfig, setPageConfig] = useState({
    cover: true,
    comparison: true,
    serviceGuide: true,
    optionDetail: true,
    photosAndFloorPlan: true,
  });

  // Custom option names for comparison table
  const [optionCustomNames, setOptionCustomNames] = useState({});

  // PDF generation state
  const [isGenerating, setIsGenerating] = useState(false);

  // Temporary state persistence
  const savedStateRef = useRef(null);

  // Load options when panel opens or selectedOptionIds change
  useEffect(() => {
    if (isOpen && selectedOptionIds.length > 0) {
      loadOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // When new options are added while panel is open (from MainPage)
  useEffect(() => {
    if (isOpen && selectedOptionIds.length > 0) {
      // Find newly added option IDs
      const currentIds = selectedOptions.map(o => o.id || o._id);
      const newIds = selectedOptionIds.filter(id => !currentIds.includes(id));
      if (newIds.length > 0) {
        addNewOptions(newIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptionIds]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Generate default proposal name
  useEffect(() => {
    if (isOpen && !proposalName) {
      const now = new Date();
      const dateStr = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      setProposalName(`${dateStr}_공유오피스_제안서`);
    }
  }, [isOpen]);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const promises = selectedOptionIds.map(id => optionAPI.getById(id));
      const responses = await Promise.all(promises);
      const options = responses.map(res => res.data.data || res.data.option);

      // If we have saved state, preserve the order and add new ones at the end
      if (savedStateRef.current) {
        const savedOrder = savedStateRef.current.optionOrder;
        const savedCustomNames = savedStateRef.current.customNames;
        const orderedOptions = [];

        // Restore saved order
        savedOrder.forEach(savedId => {
          const opt = options.find(o => (o.id || o._id) === savedId);
          if (opt) orderedOptions.push(opt);
        });

        // Add any new options at the end
        options.forEach(opt => {
          const optId = opt.id || opt._id;
          if (!savedOrder.includes(optId)) {
            orderedOptions.push(opt);
          }
        });

        setSelectedOptions(orderedOptions);
        setOptionCustomNames(savedCustomNames || {});
        setCurrentStep(savedStateRef.current.step || 1);
        setProposalName(savedStateRef.current.proposalName || proposalName);
        setShowVacancy(savedStateRef.current.showVacancy || false);
        setPageConfig(savedStateRef.current.pageConfig || pageConfig);
      } else {
        setSelectedOptions(options);
      }
    } catch (err) {
      console.error('옵션 로드 실패:', err);
      showError('옵션 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const addNewOptions = async (newIds) => {
    try {
      const promises = newIds.map(id => optionAPI.getById(id));
      const responses = await Promise.all(promises);
      const newOptions = responses.map(res => res.data.data || res.data.option);
      setSelectedOptions(prev => [...prev, ...newOptions]);
    } catch (err) {
      console.error('새 옵션 로드 실패:', err);
    }
  };

  const handleClose = () => {
    // Save temporary state
    savedStateRef.current = {
      optionOrder: selectedOptions.map(o => o.id || o._id),
      customNames: optionCustomNames,
      step: currentStep,
      proposalName,
      showVacancy,
      pageConfig,
    };
    onClose();
  };

  // Click on MainPage area (overlay)
  const handleOverlayClick = () => {
    handleClose();
  };

  // === DRAG AND DROP ===
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    dragRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
    stopAutoScroll();
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }

    // Auto-scroll when near edges
    const container = scrollContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const y = e.clientY;
      const scrollZone = 60;

      if (y < rect.top + scrollZone) {
        startAutoScroll(container, -5);
      } else if (y > rect.bottom - scrollZone) {
        startAutoScroll(container, 5);
      } else {
        stopAutoScroll();
      }
    }
  };

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
    stopAutoScroll();
  };

  const startAutoScroll = (container, speed) => {
    stopAutoScroll();
    autoScrollRef.current = setInterval(() => {
      container.scrollTop += speed;
    }, 16);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

  // === SORTING ===
  const handleSort = (sortBy) => {
    const sorted = [...selectedOptions].sort((a, b) => {
      if (sortBy === 'monthly_fee_asc') return (a.monthly_fee || 0) - (b.monthly_fee || 0);
      if (sortBy === 'monthly_fee_desc') return (b.monthly_fee || 0) - (a.monthly_fee || 0);
      if (sortBy === 'capacity_asc') return (a.capacity || 0) - (b.capacity || 0);
      if (sortBy === 'capacity_desc') return (b.capacity || 0) - (a.capacity || 0);
      return 0;
    });
    setSelectedOptions(sorted);
    setSortDropdownOpen(false);
  };

  // === OPTION ACTIONS ===
  const handleRemoveOption = (optionId) => {
    const option = selectedOptions.find(o => (o.id || o._id) === optionId);
    const optionLabel = option
      ? `${option.branch?.brand?.alias || option.branch?.brand?.name || ''} ${option.branch?.name || ''} ${option.name || ''}`
      : '';
    if (!window.confirm(`${optionLabel.trim()} 옵션을 제거하시겠습니까?`)) return;
    setSelectedOptions(prev => prev.filter(o => (o.id || o._id) !== optionId));
    if (onRemoveOption) onRemoveOption(optionId);
  };

  const handleOptionClick = (option) => {
    // Close proposal panel and open option detail
    handleClose();
    if (onViewOptionDetail) {
      onViewOptionDetail(option);
    }
  };

  const handleToggleExpand = (optionId) => {
    setExpandedOptionId(prev => prev === optionId ? null : optionId);
  };

  // === PAGE CONFIG ===
  const togglePageConfig = (key) => {
    setPageConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // === CUSTOM OPTION NAME ===
  const handleCustomNameChange = (optionId, value) => {
    setOptionCustomNames(prev => ({ ...prev, [optionId]: value }));
  };

  // === PDF GENERATION ===
  const handleGenerate = async () => {
    if (selectedOptions.length === 0) {
      showError('최소 1개 이상의 옵션을 선택해주세요');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        document_name: proposalName,
        selected_options: selectedOptions.map(opt => opt.id || opt._id),
        option_custom_info: {
          custom_names: optionCustomNames,
          page_config: pageConfig,
          show_vacancy: showVacancy,
        },
      };

      // 1. Create proposal document
      const response = await proposalDocumentAPI.create(payload);
      const createdProposal = response.data.document;
      success('제안서가 생성되었습니다');

      // 2. Generate PDF
      const pdfResponse = await proposalDocumentAPI.generatePDF(
        createdProposal.id || createdProposal._id
      );

      // 3. Download PDF
      const safeFileName = proposalName
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 100);

      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${safeFileName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('제안서 생성 실패:', err);
      showError('제안서 생성에 실패했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  // === RENDER ===
  if (!isOpen) return null;

  const getBrandAlias = (option) => {
    return option.branch?.brand?.alias || option.branch?.brand?.name || '';
  };

  const getStatusBadge = (option) => {
    if (option.status === 'completed') {
      return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">거래완료</span>;
    }
    if (option.status === 'delete_requested') {
      return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">삭제요청</span>;
    }
    return null;
  };

  const pageConfigItems = [
    { key: 'cover', label: '표지', description: '제안서 표지 페이지' },
    { key: 'comparison', label: '비교표', description: '매물 비교표' },
    { key: 'serviceGuide', label: '위치 안내', description: '서비스 안내 페이지' },
    { key: 'optionDetail', label: '상세 정보', description: '옵션별 상세 정보' },
    { key: 'photosAndFloorPlan', label: '사진 및 평면도', description: '내부 사진 및 평면도' },
  ];

  return (
    <>
      {/* Overlay - click to close and save state */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-[80]"
        onClick={handleOverlayClick}
      />

      {/* Sliding Panel */}
      <div className="fixed right-0 top-0 h-full bg-white shadow-2xl flex flex-col z-[85] transition-transform duration-300"
        style={{ width: 'calc(100% - 320px)', minWidth: '700px' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition"
              title="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-900">제안서 생성</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Step indicators could go here in future */}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            </div>
          ) : currentStep === 1 ? (
            // === STEP 1: Option List ===
            <div className="p-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    선택한 매물 <span className="text-orange-500">{selectedOptions.length}개</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sort dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                    >
                      실별 월 고정비
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {sortDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <button onClick={() => handleSort('monthly_fee_asc')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">월고정비 낮은순</button>
                        <button onClick={() => handleSort('monthly_fee_desc')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">월고정비 높은순</button>
                        <button onClick={() => handleSort('capacity_asc')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">인실 적은순</button>
                        <button onClick={() => handleSort('capacity_desc')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">인실 많은순</button>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Option List */}
              <div className="space-y-1">
                {selectedOptions.map((option, index) => {
                  const optId = option.id || option._id;
                  const isExpanded = expandedOptionId === optId;
                  const brandAlias = getBrandAlias(option);
                  const branchName = option.branch?.name || '';

                  return (
                    <div
                      key={optId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`bg-white border rounded-lg transition-all ${
                        dragOverIndex === index
                          ? 'border-orange-400 border-2 bg-orange-50'
                          : 'border-gray-200'
                      } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    >
                      {/* Option row */}
                      <div className="flex items-center px-4 py-3 gap-3">
                        {/* Drag handle */}
                        <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </div>

                        {/* Expand toggle */}
                        <button
                          onClick={() => handleToggleExpand(optId)}
                          className="text-gray-400 hover:text-gray-600 shrink-0"
                        >
                          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {/* Thumbnail */}
                        {option.branch?.exterior_image_url ? (
                          <img
                            src={option.branch.exterior_image_url}
                            alt=""
                            className="w-10 h-10 rounded object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 shrink-0" />
                        )}

                        {/* Option info: 브랜드 지점 옵션명 주소 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-sm text-gray-900">
                              {brandAlias}
                            </span>
                            <span className="text-sm text-gray-700">
                              {branchName}
                            </span>
                            <span className="text-sm text-gray-600">
                              {option.name}
                            </span>
                            {getStatusBadge(option)}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 truncate">
                            {option.branch?.address || ''}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* View detail (opens OptionDetailSlide) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOptionClick(option);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="상세보기"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>

                          {/* Remove */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveOption(optId);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="제거"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded content: 상세 정보 */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                          <div className="grid grid-cols-3 gap-x-6 gap-y-2 mt-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">보증금</span>
                              <span className="font-medium">{formatPrice(option.deposit)}원</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">월 고정비</span>
                              <span className="font-medium text-orange-600">{formatPrice(option.monthly_fee)}원</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">옵션타입</span>
                              <span className="font-medium">{formatCategory1(option.category1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">인실</span>
                              <span className="font-medium">{option.capacity}인</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">계약기간</span>
                              <span className="font-medium">{formatContractPeriod(option.contract_period_type, option.contract_period_value)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">전용면적</span>
                              <span className="font-medium">
                                {option.exclusive_area?.value
                                  ? `${option.exclusive_area.value}${option.exclusive_area.unit === 'pyeong' ? '평' : '㎡'}`
                                  : '-'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">인단가</span>
                              <span className="font-medium">
                                {option.capacity && option.monthly_fee
                                  ? `${formatPrice(Math.round(option.monthly_fee / option.capacity))}원`
                                  : '-'}
                              </span>
                            </div>
                            <div className="flex justify-between col-span-2">
                              <span className="text-gray-500">크레딧</span>
                              <span className="font-medium">
                                {option.credits && option.credits.length > 0
                                  ? option.credits.map((c, i) => (
                                    <span key={i}>
                                      {c.type === 'other'
                                        ? `${c.customName || '기타'}: 월 ${c.amount}${c.unit || '크레딧'}`
                                        : `${c.type === 'monthly' ? '크레딧' : c.type === 'printing' ? '프린팅' : '미팅룸'}: 월 ${c.amount}크레딧`}
                                      {i < option.credits.length - 1 && ', '}
                                    </span>
                                  ))
                                  : '-'}
                              </span>
                            </div>
                            {option.office_info && (
                              <div className="flex justify-between col-span-3">
                                <span className="text-gray-500 shrink-0 mr-2">오피스정보</span>
                                <span className="font-medium text-right">{option.office_info}</span>
                              </div>
                            )}
                          </div>

                          {/* Custom name for comparison table */}
                          <div className="mt-3">
                            <label className="text-xs text-gray-500 block mb-1">비교표 추가 표기명</label>
                            <input
                              type="text"
                              value={optionCustomNames[optId] || ''}
                              onChange={(e) => handleCustomNameChange(optId, e.target.value)}
                              placeholder={`${brandAlias} ${branchName}`}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {selectedOptions.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    선택된 옵션이 없습니다.
                  </div>
                )}
              </div>
            </div>
          ) : (
            // === STEP 2: Page Configuration ===
            <div className="p-6">
              {/* Proposal name */}
              <section className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">표기명</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <span className="px-3 py-2 bg-gray-50 text-sm text-gray-500 border-r border-gray-300 whitespace-nowrap">
                      제안서 및<br/>파일명
                    </span>
                    <input
                      type="text"
                      value={proposalName}
                      onChange={(e) => setProposalName(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm focus:outline-none"
                    />
                    <span className="px-3 py-2 text-sm text-gray-400">.pdf</span>
                  </div>
                </div>
              </section>

              {/* Vacancy display option */}
              <section className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">건물 내 공실 표시</h3>
                <div className="flex items-center gap-4 border border-gray-200 rounded-lg p-3">
                  <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">표시 옵션</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="vacancy"
                      checked={showVacancy}
                      onChange={() => setShowVacancy(true)}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-sm">모두 표기</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="vacancy"
                      checked={!showVacancy}
                      onChange={() => setShowVacancy(false)}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-sm text-orange-500 font-medium">표기 안함</span>
                  </label>
                </div>
              </section>

              {/* Page configuration */}
              <section className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">페이지 구성</h3>
                <div className="grid grid-cols-5 gap-4">
                  {pageConfigItems.map((item) => (
                    <div key={item.key} className="flex flex-col items-center">
                      <div
                        onClick={() => togglePageConfig(item.key)}
                        className={`w-full aspect-[3/4] rounded-lg border-2 cursor-pointer transition-all overflow-hidden flex items-center justify-center bg-gray-50 ${
                          pageConfig[item.key]
                            ? 'border-orange-400 shadow-md'
                            : 'border-gray-200 opacity-50'
                        }`}
                      >
                        <div className="text-center p-2">
                          <div className="text-xs text-gray-400 mb-1">{item.description}</div>
                          <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div
                          onClick={() => togglePageConfig(item.key)}
                          className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                            pageConfig[item.key]
                              ? 'bg-orange-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          {pageConfig[item.key] && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Info notice */}
              <section className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-600">제안서 생성 안내 사항</p>
                    <ul className="space-y-0.5 list-disc pl-4">
                      <li>조건 수정 및 다운로드 이력이 히스토리에 기록됩니다.</li>
                      <li>페이지 구성 변경 시, 선택된 모든 매물에 적용됩니다.</li>
                      <li>제안서를 다운로드하는 사용자의 이름과 연락처가 제안서에 노출됩니다.</li>
                      <li>생성된 제안서 파일은 A4 용지 가로(297 × 210mm), 실제 크기 배율은 인쇄에 최적화되어있습니다.</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                이전
              </button>
            )}
          </div>
          <div>
            {currentStep === 1 ? (
              <button
                onClick={() => setCurrentStep(2)}
                disabled={selectedOptions.length === 0}
                className="px-6 py-2.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || selectedOptions.length === 0}
                className="px-6 py-2.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                제안서 다운로드
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading overlay during PDF generation */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-white text-sm font-medium">제안서를 생성하고 있습니다...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ProposalCreateSlide;
