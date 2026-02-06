import { useState } from 'react';
import InfoTable from './InfoTable';
import {
  formatPrice,
  formatCategory1,
  formatDate,
} from '../../utils/formatters';
import { optionAPI } from '../../services/api';

/**
 * OptionInfoTab - 옵션 상세 정보 탭
 * 평면도 이미지, 기본 정보(인실/유형), 거래 정보, 상세 정보
 *
 * @param {object} option - 옵션 데이터
 * @param {object} branch - 지점 데이터
 * @param {function} onImageClick - 이미지 클릭 콜백
 */
const OptionInfoTab = ({ option, branch, onImageClick }) => {
  const [showFeeHistory, setShowFeeHistory] = useState(false);
  const [feeHistory, setFeeHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  if (!option) return null;

  const optionId = option.id || option._id;

  const formatHvacType = (type) => {
    const map = { central: '중앙냉난방', individual: '개별냉난방' };
    return map[type] || type || '-';
  };

  const formatParkingType = (type) => {
    const map = { self_parking: '자주식', mechanical: '기계식' };
    return map[type] || type || '-';
  };

  const formatExclusiveArea = (area) => {
    if (!area?.value) return '-';
    return `${area.value} ${area.unit === 'pyeong' ? '평' : '㎡'}`;
  };

  const formatCredits = (credits) => {
    if (!credits || !Array.isArray(credits) || credits.length === 0) return '-';
    return credits.map((credit, idx) => {
      const name = credit.type === 'other'
        ? (credit.customName || '기타')
        : credit.type === 'monthly' ? '크레딧' : credit.type === 'printing' ? '프린팅' : '미팅룸';
      const unit = credit.unit || '크레딧';
      const note = credit.note ? ` (${credit.note})` : '';
      return (
        <div key={idx}>
          {name} : 월 {credit.amount} {unit} 제공{note}
        </div>
      );
    });
  };

  const formatOneTimeFees = (fees) => {
    if (!fees || fees.length === 0) return '-';
    return fees.map((fee, idx) => (
      <div key={idx}>{fee.type}: {formatPrice(fee.amount)}원</div>
    ));
  };

  // 인단가 계산 (월고정비 / 인실)
  const getPerPersonCost = () => {
    const fee = option.monthly_fee || 0;
    const cap = option.capacity || 0;
    if (!fee || !cap) return '-';
    return `${formatPrice(Math.round(fee / cap))}원`;
  };

  // 인당 면적 계산 (전용면적 / 인실)
  const getPerPersonArea = () => {
    const area = option.exclusive_area;
    const cap = option.capacity || 0;
    if (!area?.value || !cap) return '-';
    const val = (parseFloat(area.value) / cap).toFixed(1);
    return `${val} ${area.unit === 'pyeong' ? '평' : '㎡'}`;
  };

  // 월 고정비 히스토리 조회
  const handleShowFeeHistory = async () => {
    if (showFeeHistory) {
      setShowFeeHistory(false);
      return;
    }
    setLoadingHistory(true);
    setShowFeeHistory(true);
    try {
      const response = await optionAPI.getMonthlyFeeHistory(optionId);
      setFeeHistory(response.data?.history || []);
    } catch (err) {
      console.error('월 고정비 히스토리 조회 실패:', err);
      setFeeHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 옵션 평면도 이미지만
  const floorPlanUrls = option.floor_plan_urls || (option.floor_plan_url ? [option.floor_plan_url] : []);

  // 옵션 기본 정보 (인실, 유형만)
  const basicInfoRows = [
    { label: '인실', value: option.capacity ? `${option.capacity}인` : '-' },
    { label: '유형', value: option.category1 ? formatCategory1(option.category1) : '-' },
  ];

  // 월 고정비 값 + 히스토리 아이콘
  const monthlyFeeValue = option.monthly_fee ? (
    <span className="flex items-center gap-1.5">
      <span>{formatPrice(option.monthly_fee)}원</span>
      <button
        onClick={handleShowFeeHistory}
        title="금액 변경 히스토리"
        className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-orange-100 transition text-gray-400 hover:text-orange-600"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </span>
  ) : '-';

  // 옵션 거래 정보
  const transactionRows = [
    { label: '전용면적', value: formatExclusiveArea(option.exclusive_area) },
    {
      label: '월 고정비',
      value: monthlyFeeValue,
      highlight: true,
    },
    { label: '보증금', value: option.deposit ? `${formatPrice(option.deposit)}원` : '-' },
    { label: '정가', value: option.list_price ? `${formatPrice(option.list_price)}원` : '-' },
    { label: '일회성 비용', value: formatOneTimeFees(option.one_time_fees) },
    { label: '크레딧', value: formatCredits(option.credits) },
    { label: '인단가', value: getPerPersonCost() },
    { label: '인당 면적', value: getPerPersonArea() },
  ];

  // 옵션 상세 정보 (주차, 냉난방, 옵션 설명만)
  const detailRows = [
    { label: '주차', value: (() => {
      if (!option.parking_type) return '-';
      const parts = [formatParkingType(option.parking_type)];
      if (option.parking_count) parts.push(`${option.parking_count}대`);
      if (option.parking_cost) parts.push(`비용 ${formatPrice(option.parking_cost)}원`);
      if (option.parking_note) parts.push(option.parking_note);
      return parts.join(', ');
    })() },
    { label: '냉난방', value: formatHvacType(option.hvac_type) },
    {
      label: '옵션 설명',
      value: option.office_info || option.memo || '-',
      colSpan: true,
    },
  ];

  // 등록 정보
  const registrationRows = [
    { label: '작성자', value: option.creator?.name || option.created_by?.name || '-' },
    { label: '등록일', value: option.created_at ? formatDate(option.created_at) : '-' },
    ...(option.updated_at && option.updated_at !== option.created_at
      ? [{ label: '수정일', value: formatDate(option.updated_at) }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* 평면도 이미지 영역 */}
      <div className="mb-6">
        {floorPlanUrls.length > 0 ? (
          <FloorPlanGallery images={floorPlanUrls} onImageClick={onImageClick} />
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">사진을 업로드 하세요</span>
            <span className="text-xs text-gray-300 mt-1">수정 모드에서 평면도를 등록할 수 있습니다</span>
          </div>
        )}
      </div>

      {/* 옵션 기본 정보 */}
      <InfoTable title="옵션 기본 정보" rows={basicInfoRows} />

      {/* 옵션 거래 정보 */}
      <InfoTable title="옵션 거래 정보" rows={transactionRows} />

      {/* 월 고정비 변경 히스토리 */}
      {showFeeHistory && (
        <MonthlyFeeHistoryPanel
          loading={loadingHistory}
          history={feeHistory}
          onClose={() => setShowFeeHistory(false)}
        />
      )}

      {/* 옵션 상세 정보 */}
      <InfoTable title="옵션 상세 정보" rows={detailRows} />

      {/* 등록 정보 */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500 space-y-1">
          {registrationRows.map((row, idx) => (
            <div key={idx}>{row.label}: {row.value}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * MonthlyFeeHistoryPanel - 월 고정비 변경 히스토리 패널
 */
const MonthlyFeeHistoryPanel = ({ loading, history, onClose }) => {
  const formatHistoryDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-orange-800 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          월 고정비 변경 히스토리
        </h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          &times;
        </button>
      </div>

      {loading ? (
        <div className="text-center text-sm text-gray-500 py-4">불러오는 중...</div>
      ) : history.length === 0 ? (
        <div className="text-center text-sm text-gray-500 py-4">변경 히스토리가 없습니다.</div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {history.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-orange-100 text-sm">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-400"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-500 line-through">{formatPrice(item.previous_amount)}원</span>
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="text-orange-600 font-semibold">{formatPrice(item.new_amount)}원</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {item.changed_by_name && <span>{item.changed_by_name} | </span>}
                  {formatHistoryDate(item.changed_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * FloorPlanGallery - 평면도 이미지 전용 갤러리 (썸네일 없음)
 */
const FloorPlanGallery = ({ images, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const handlePrev = () => setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  const handleNext = () => setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
      onClick={() => onImageClick && onImageClick(images[currentIndex], images, currentIndex)}
    >
      <img
        src={images[currentIndex]}
        alt={`평면도 ${currentIndex + 1}`}
        className="w-full h-[300px] object-contain bg-white"
      />
      {/* 이미지 카운터 */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
          {currentIndex + 1}/{images.length}
        </div>
      )}
      {/* 네비게이션 */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default OptionInfoTab;
