import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { optionAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import {
  formatPrice,
  formatCategory1,
  formatCategory2,
  formatMoveInDate,
  formatContractPeriod,
} from '../../utils/formatters';

const OptionDetailSlide = ({
  option,
  isOpen,
  onClose,
  onComplete,
  onReactivate,
  onCancelDeleteRequest,
  onEdit,
  onDelete,
  onUpdate
}) => {
  const { user } = useAuth();
  const { success, error: showError, warning } = useToast();
  const fileInputRef = useRef(null);

  // 이미지 관련 상태
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageGallery, setImageGallery] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 수정 모드 관련 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 권한 확인
  const isOwner = user && option && user.id === option.creator_id;
  const isAdmin = user && user.role === 'admin';
  const canEdit = (isOwner || isAdmin) && option?.status !== 'completed' && option?.status !== 'delete_requested';
  const canDelete = (isOwner || isAdmin) && option?.status !== 'completed' && option?.status !== 'delete_requested';

  // 숫자 포맷팅 (쉼표 추가)
  const formatNumberWithComma = (value) => {
    if (!value && value !== 0) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 쉼표 제거하고 숫자만 추출
  const parseNumberFromComma = (value) => {
    if (!value) return '';
    return value.toString().replace(/,/g, '');
  };

  // 수정 데이터 초기화
  useEffect(() => {
    if (option && isOpen) {
      const data = {
        name: option.name || '',
        category1: option.category1 || '',
        category2: option.category2 || '',
        capacity: option.capacity || 1,
        monthly_fee: option.monthly_fee || 0,
        deposit: option.deposit || 0,
        list_price: option.list_price || '',
        move_in_date_type: option.move_in_date_type || 'immediate',
        move_in_date_value: option.move_in_date_value || '',
        contract_period_type: option.contract_period_type || 'twelve_months',
        contract_period_value: option.contract_period_value || '',
        hvac_type: option.hvac_type || '',
        parking_type: option.parking_type || '',
        parking_note: option.parking_note || '',
        office_info: option.office_info || '',
        memo: option.memo || '',
        exclusive_area: option.exclusive_area || { value: '', unit: 'pyeong' },
        one_time_fees: option.one_time_fees || [],
        credits: option.credits || [],
        floor_plan_url: option.floor_plan_url || '',
      };
      setEditData(data);
      setOriginalData(data);
      setHasChanges(false);
    }
  }, [option, isOpen]);

  // 변경사항 체크
  useEffect(() => {
    if (isEditMode) {
      const changed = JSON.stringify(editData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [editData, originalData, isEditMode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      setSelectedImage(null);
      setImageGallery([]);
      setCurrentImageIndex(0);
      setIsEditMode(false);
      setHasChanges(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC 키 핸들러
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        if (selectedImage) {
          closeImageModal();
        } else if (isEditMode && hasChanges) {
          if (window.confirm('변경사항이 있습니다. 수정을 취소하시겠습니까?')) {
            handleCancelEdit();
          }
        } else if (isEditMode) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, selectedImage, isEditMode, hasChanges, onClose]);

  // 이미지 키보드 네비게이션
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevImage();
      else if (e.key === 'ArrowRight') handleNextImage();
      else if (e.key === 'Escape') closeImageModal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentImageIndex, imageGallery]);

  const handleCloseAttempt = useCallback(() => {
    if (isEditMode && hasChanges) {
      if (window.confirm('변경사항이 있습니다. 저장하지 않고 닫으시겠습니까?')) {
        setIsEditMode(false);
        setEditData(originalData);
        onClose();
      }
    } else {
      if (isEditMode) setIsEditMode(false);
      onClose();
    }
  }, [isEditMode, hasChanges, originalData, onClose]);

  if (!isOpen || !option) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatHvacType = (type) => {
    const map = { central: '중앙냉난방', individual: '개별냉난방' };
    return map[type] || type || '-';
  };

  const formatParkingType = (type) => {
    const map = { self_parking: '자주식', mechanical: '기계식' };
    return map[type] || type || '-';
  };

  const handleImageClick = (imageUrl, gallery = null, index = 0) => {
    setSelectedImage(imageUrl);
    if (gallery && gallery.length > 0) {
      setImageGallery(gallery);
      setCurrentImageIndex(index);
    } else {
      setImageGallery([imageUrl]);
      setCurrentImageIndex(0);
    }
  };

  const handlePrevImage = () => {
    if (imageGallery.length <= 1) return;
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : imageGallery.length - 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(imageGallery[newIndex]);
  };

  const handleNextImage = () => {
    if (imageGallery.length <= 1) return;
    const newIndex = currentImageIndex < imageGallery.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setSelectedImage(imageGallery[newIndex]);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setImageGallery([]);
    setCurrentImageIndex(0);
  };

  // 수정 모드 핸들러
  const handleStartEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (hasChanges) {
      warning('변경사항이 취소되었습니다');
    }
    setEditData(originalData);
    setIsEditMode(false);
    setHasChanges(false);
  };

  const handleSaveEdit = async () => {
    if (!hasChanges) {
      setIsEditMode(false);
      return;
    }

    setIsSaving(true);
    try {
      const updatePayload = {
        ...editData,
        monthly_fee: parseFloat(parseNumberFromComma(editData.monthly_fee)) || 0,
        deposit: parseFloat(parseNumberFromComma(editData.deposit)) || 0,
        capacity: parseInt(editData.capacity) || 1,
        list_price: editData.list_price ? parseFloat(parseNumberFromComma(editData.list_price)) : null,
      };

      await optionAPI.update(option.id, updatePayload);
      success('옵션이 수정되었습니다');
      setOriginalData(editData);
      setIsEditMode(false);
      setHasChanges(false);

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('옵션 수정 실패:', err);
      showError(err.response?.data?.message || '옵션 수정에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // 가격 입력 핸들러 (쉼표 자동 추가)
  const handlePriceInputChange = (field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setEditData(prev => ({ ...prev, [field]: numericValue }));
  };

  // 이미지 삭제 핸들러
  const handleRemoveFloorPlan = () => {
    if (window.confirm('평면도 이미지를 삭제하시겠습니까?')) {
      setEditData(prev => ({ ...prev, floor_plan_url: '' }));
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('파일 크기는 10MB 이하여야 합니다');
      return;
    }

    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
      showError('이미지 파일만 업로드 가능합니다');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('업로드 실패');

      const data = await response.json();
      setEditData(prev => ({ ...prev, floor_plan_url: data.url }));
      success('이미지가 업로드되었습니다');
    } catch (err) {
      console.error('이미지 업로드 실패:', err);
      showError('이미지 업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 편집 가능한 필드 렌더링
  const renderEditableField = (label, field, type = 'text', options = null) => {
    const value = editData[field];

    if (!isEditMode) {
      let displayValue = value;
      if (field === 'monthly_fee' || field === 'deposit' || field === 'list_price') {
        displayValue = value ? `${formatPrice(value)}원` : '-';
      } else if (field === 'capacity') {
        displayValue = `${value}인`;
      } else if (field === 'category1') {
        displayValue = formatCategory1(value);
      } else if (field === 'category2') {
        displayValue = value ? formatCategory2(value) : '-';
      } else if (field === 'hvac_type') {
        displayValue = formatHvacType(value);
      } else if (field === 'parking_type') {
        displayValue = formatParkingType(value);
      }

      return (
        <div className="flex">
          <span className="text-gray-600 w-32">{label}:</span>
          <span className="font-semibold flex-1">{displayValue || '-'}</span>
        </div>
      );
    }

    // 수정 모드
    if (options) {
      return (
        <div className="flex items-center">
          <span className="text-gray-600 w-32">{label}:</span>
          <select
            value={value || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">선택</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div className="flex">
          <span className="text-gray-600 w-32">{label}:</span>
          <textarea
            value={value || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
          />
        </div>
      );
    }

    // 가격 필드 (쉼표 표시)
    if (type === 'price') {
      return (
        <div className="flex items-center">
          <span className="text-gray-600 w-32">{label}:</span>
          <div className="flex-1 relative">
            <input
              type="text"
              value={formatNumberWithComma(value)}
              onChange={(e) => handlePriceInputChange(field, e.target.value)}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <span className="text-gray-600 w-32">{label}:</span>
        <input
          type={type}
          value={value || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    );
  };

  const category1Options = [
    { value: 'exclusive_floor', label: '전용층' },
    { value: 'connected_floor', label: '연층' },
    { value: 'separate_floor', label: '분리층' },
    { value: 'exclusive_room', label: '전용호실' },
    { value: 'connected_room', label: '연접호실' },
    { value: 'separate_room', label: '분리호실' },
  ];

  const category2Options = [
    { value: 'window_side', label: '창측' },
    { value: 'inner_side', label: '내측' },
  ];

  const hvacOptions = [
    { value: 'central', label: '중앙냉난방' },
    { value: 'individual', label: '개별냉난방' },
  ];

  const parkingOptions = [
    { value: 'self_parking', label: '자주식' },
    { value: 'mechanical', label: '기계식' },
  ];

  const moveInDateOptions = [
    { value: 'immediate', label: '즉시입주' },
    { value: 'negotiable', label: '협의' },
    { value: 'custom', label: '직접입력' },
  ];

  const contractPeriodOptions = [
    { value: 'six_months', label: '6개월' },
    { value: 'twelve_months', label: '12개월' },
    { value: 'custom', label: '직접입력' },
  ];

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-[90]"
        onClick={handleCloseAttempt}
      />

      {/* 우측 슬라이드 패널 */}
      <div className="fixed right-0 top-0 h-full w-[700px] bg-white shadow-2xl flex flex-col z-[100]">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? '옵션 수정' : '상세 정보'}
          </h2>
          <div className="flex items-center gap-3">
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !hasChanges}
                  className={`px-4 py-2 font-medium rounded-lg transition text-sm ${
                    hasChanges
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </>
            ) : (
              <>
                {onCancelDeleteRequest && option.status === 'delete_requested' && user && user.id === option.creator_id && (
                  <button
                    onClick={() => {
                      if (window.confirm('삭제 요청을 취소하시겠습니까?')) {
                        onCancelDeleteRequest(option.id);
                      }
                    }}
                    className="px-4 py-2 bg-orange-100 text-orange-700 font-medium rounded-lg hover:bg-orange-200 transition text-sm"
                  >
                    삭제요청 취소
                  </button>
                )}
                {onComplete && option.status === 'active' && user && (user.id === option.creator_id || user.role === 'admin') && (
                  <button
                    onClick={() => {
                      if (window.confirm('이 옵션을 거래완료 처리하시겠습니까?\n거래완료 처리 후에는 수정할 수 없습니다.')) {
                        onComplete(option.id);
                      }
                    }}
                    className="px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition text-sm"
                  >
                    거래완료
                  </button>
                )}
                {onReactivate && option.status === 'completed' && user && (user.id === option.creator_id || user.role === 'admin') && (
                  <button
                    onClick={() => {
                      if (window.confirm('이 옵션을 거래재개 처리하시겠습니까?')) {
                        onReactivate(option.id);
                      }
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition text-sm"
                  >
                    거래재개
                  </button>
                )}
              </>
            )}
            <button
              onClick={handleCloseAttempt}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 본문 - 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* 지점 정보 (수정 불가) */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">지점 정보</h3>
            <div className="space-y-3">
              <div className="flex">
                <span className="text-gray-600 w-32">브랜드:</span>
                <span className="font-semibold flex-1">{option.branch?.brand?.name}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-32">지점명:</span>
                <span className="font-semibold flex-1">{option.branch?.name}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-32">주소:</span>
                <span className="font-semibold flex-1">{option.branch?.address}</span>
              </div>
              {option.branch?.nearest_subway && (
                <div className="flex">
                  <span className="text-gray-600 w-32">지하철역:</span>
                  <span className="font-semibold flex-1">
                    {option.branch.nearest_subway} (도보 {option.branch.walking_distance}분)
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* 옵션 기본 정보 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">옵션 정보</h3>
            <div className="space-y-3">
              {renderEditableField('옵션명', 'name')}
              {renderEditableField('분류1', 'category1', 'select', category1Options)}
              {editData.category1 !== 'exclusive_floor' && renderEditableField('분류2', 'category2', 'select', category2Options)}
              {renderEditableField('인실', 'capacity', 'number')}
            </div>
          </section>

          {/* 가격 정보 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">가격 정보</h3>
            <div className="space-y-3">
              {renderEditableField('월사용료', 'monthly_fee', 'price')}
              {renderEditableField('보증금', 'deposit', 'price')}
              {renderEditableField('정가', 'list_price', 'price')}

              {/* 일회성 비용 표시 */}
              {(option.one_time_fees && option.one_time_fees.length > 0) && (
                <div className="mt-4">
                  <span className="text-gray-600 font-medium">일회성 비용:</span>
                  <div className="mt-2 space-y-2">
                    {option.one_time_fees.map((fee, index) => (
                      <div key={index} className="flex items-center gap-2 pl-4">
                        <span className="text-sm text-gray-600">• {fee.type}:</span>
                        <span className="text-sm font-semibold">{formatPrice(fee.amount)}원</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 계약 정보 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">계약 정보</h3>
            <div className="space-y-3">
              {!isEditMode ? (
                <>
                  <div className="flex">
                    <span className="text-gray-600 w-32">입주가능일:</span>
                    <span className="font-semibold flex-1">
                      {formatMoveInDate(option.move_in_date_type, option.move_in_date_value)}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">계약기간:</span>
                    <span className="font-semibold flex-1">
                      {formatContractPeriod(option.contract_period_type, option.contract_period_value)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {/* 입주가능일 수정 */}
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">입주가능일:</span>
                    <div className="flex-1 flex gap-2">
                      <select
                        value={editData.move_in_date_type || 'immediate'}
                        onChange={(e) => handleInputChange('move_in_date_type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {moveInDateOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {editData.move_in_date_type === 'custom' && (
                        <input
                          type="text"
                          value={editData.move_in_date_value || ''}
                          onChange={(e) => handleInputChange('move_in_date_value', e.target.value)}
                          placeholder="예: 2024년 3월"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      )}
                    </div>
                  </div>
                  {/* 계약기간 수정 */}
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">계약기간:</span>
                    <div className="flex-1 flex gap-2">
                      <select
                        value={editData.contract_period_type || 'twelve_months'}
                        onChange={(e) => handleInputChange('contract_period_type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {contractPeriodOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {editData.contract_period_type === 'custom' && (
                        <input
                          type="text"
                          value={editData.contract_period_value || ''}
                          onChange={(e) => handleInputChange('contract_period_value', e.target.value)}
                          placeholder="예: 최소 3개월"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* 추가 정보 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {isEditMode ? '추가정보 (선택입력사항)' : '추가 정보'}
            </h3>
            <div className="space-y-3">
              {/* 전용면적 */}
              <div className="flex">
                <span className="text-gray-600 w-32">전용면적:</span>
                <span className="font-semibold flex-1">
                  {option.exclusive_area?.value
                    ? `${option.exclusive_area.value} ${option.exclusive_area.unit === 'pyeong' ? '평' : '㎡'}`
                    : '-'}
                </span>
              </div>

              {renderEditableField('냉난방', 'hvac_type', 'select', hvacOptions)}
              {renderEditableField('주차', 'parking_type', 'select', parkingOptions)}
              {renderEditableField('주차메모', 'parking_note')}

              {/* 크레딧 표시 */}
              {option.credits && option.credits.length > 0 && (
                <div className="flex">
                  <span className="text-gray-600 w-32">크레딧:</span>
                  <div className="flex-1">
                    {option.credits.map((credit, idx) => (
                      <div key={idx} className="font-semibold">
                        {credit.type === 'monthly' && '월별 제공'}
                        {credit.type === 'printing' && '프린팅'}
                        {credit.type === 'meeting_room' && '미팅룸'}
                        {credit.type === 'other' && '기타'}
                        : {credit.amount?.toLocaleString()}
                        {credit.note && ` (${credit.note})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderEditableField('오피스정보', 'office_info', 'textarea')}
            </div>
          </section>

          {/* 메모 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">메모</h3>
            {isEditMode ? (
              <textarea
                value={editData.memo || ''}
                onChange={(e) => handleInputChange('memo', e.target.value)}
                placeholder="메모를 입력하세요..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {option.memo || '-'}
              </p>
            )}
          </section>

          {/* 옵션 평면도 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">옵션 평면도</h3>
            {isEditMode ? (
              <div className="space-y-3">
                {editData.floor_plan_url ? (
                  <div className="relative inline-block">
                    <img
                      src={editData.floor_plan_url}
                      alt="옵션 평면도"
                      className="h-32 w-auto rounded-lg shadow-md object-cover"
                    />
                    <button
                      onClick={handleRemoveFloorPlan}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="floor-plan-upload"
                    />
                    <label
                      htmlFor="floor-plan-upload"
                      className={`px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition flex items-center gap-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-gray-500">업로드 중...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-gray-500">이미지 첨부</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            ) : option.floor_plan_url ? (
              <div className="flex flex-wrap gap-3">
                <img
                  src={option.floor_plan_url}
                  alt="옵션 평면도"
                  className="h-32 w-auto rounded-lg shadow-md cursor-pointer hover:opacity-80 transition object-cover"
                  onClick={() => handleImageClick(option.floor_plan_url)}
                />
              </div>
            ) : (
              <p className="text-gray-400">-</p>
            )}
          </section>

          {/* 지점 외부 사진 */}
          {option.branch?.exterior_image_url && (
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">지점 외부 사진</h3>
              <div className="flex flex-wrap gap-3">
                <img
                  src={option.branch.exterior_image_url}
                  alt="지점 외부"
                  className="h-32 w-auto rounded-lg shadow-md cursor-pointer hover:opacity-80 transition object-cover"
                  onClick={() => handleImageClick(option.branch.exterior_image_url)}
                />
              </div>
            </section>
          )}

          {/* 지점 내부 사진 */}
          {option.branch?.interior_image_urls && option.branch.interior_image_urls.length > 0 && (
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">지점 내부 사진</h3>
              <div className="flex flex-wrap gap-3">
                {option.branch.interior_image_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`지점 내부 ${index + 1}`}
                    className="h-32 w-auto rounded-lg shadow-md cursor-pointer hover:opacity-80 transition object-cover"
                    onClick={() => handleImageClick(url, option.branch.interior_image_urls, index)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 등록 정보 */}
          <section className="pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500 space-y-1">
              {(option.creator || option.created_by) && (
                <div>작성자: {option.creator?.name || option.created_by?.name || option.creator?.email || option.created_by?.email}</div>
              )}
              {option.created_at && (
                <div>등록일: {formatDate(option.created_at)}</div>
              )}
              {option.updated_at && option.updated_at !== option.created_at && (
                <div>수정일: {formatDate(option.updated_at)}</div>
              )}
            </div>
          </section>

          {/* 푸터 공간 확보 */}
          <div className="pb-20" />
        </div>

        {/* 푸터 - 수정/삭제 버튼 */}
        {!isEditMode && (canEdit || canDelete) && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 flex gap-3">
            {canEdit && (
              <button
                onClick={handleStartEdit}
                className="flex-1 px-4 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
              >
                수정
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(option.id)}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition"
              >
                삭제 요청
              </button>
            )}
          </div>
        )}
      </div>

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-80 z-[110]"
            onClick={closeImageModal}
          />
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-8"
            onClick={closeImageModal}
          >
            {imageGallery.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:text-gray-300 transition bg-black bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center hover:bg-opacity-70"
              >
                ‹
              </button>
            )}

            <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closeImageModal}
                className="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 transition"
              >
                ✕
              </button>
              <img
                src={selectedImage}
                alt="확대 이미지"
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              />
              {imageGallery.length > 1 && (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
                  {currentImageIndex + 1} / {imageGallery.length}
                </div>
              )}
            </div>

            {imageGallery.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:text-gray-300 transition bg-black bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center hover:bg-opacity-70"
              >
                ›
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default OptionDetailSlide;
