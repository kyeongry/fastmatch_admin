import InfoTable from './InfoTable';
import ImageGallery from './ImageGallery';
import {
  formatPrice,
  formatCategory1,
  formatCategory2,
  formatMoveInDate,
  formatContractPeriod,
  formatDate,
} from '../../utils/formatters';

/**
 * OptionInfoTab - 옵션(매물) 상세 정보 탭
 * 기본 정보, 거래 정보, 상세 정보, 평가 정보를 구조화된 테이블로 표시
 *
 * @param {object} option - 옵션 데이터
 * @param {object} branch - 지점 데이터
 * @param {function} onImageClick - 이미지 클릭 콜백
 */
const OptionInfoTab = ({ option, branch, onImageClick }) => {
  if (!option) return null;

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

  // 옵션 평면도 이미지
  const floorPlanUrls = option.floor_plan_urls || (option.floor_plan_url ? [option.floor_plan_url] : []);

  // 지점 내부 이미지 (지점 사진)
  const allBranchImages = [
    ...(branch?.exterior_image_url ? [branch.exterior_image_url] : []),
    ...(branch?.interior_image_urls || []),
  ];

  // 카테고리 뱃지
  const categoryBadge = option.category1 ? (
    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded mr-1">
      {formatCategory1(option.category1)}
    </span>
  ) : null;

  // 월 고정비 계산 (월사용료 + 관리비 같은 것이 있다면)
  const monthlyTotal = option.monthly_fee || 0;

  // 매물 기본 정보
  const basicInfoRows = [
    { label: '상세주소', value: branch?.address || '-' },
    { label: '매물 유형', value: categoryBadge || '-' },
  ];

  // 매물 거래 정보
  const transactionRows = [
    { label: '해당 옵션', value: option.name || '-' },
    { label: '거래 유형', value: '월 임대' },
    { label: '인실', value: option.capacity ? `${option.capacity}인` : '-' },
    { label: '전용면적', value: formatExclusiveArea(option.exclusive_area) },
    { label: '보증금', value: option.deposit ? `${formatPrice(option.deposit)}원` : '-' },
    { label: '월 임대료', value: option.monthly_fee ? `${formatPrice(option.monthly_fee)}원` : '-' },
    { label: '정가', value: option.list_price ? `${formatPrice(option.list_price)}원` : '-' },
    {
      label: '월 고정비',
      value: monthlyTotal ? `${formatPrice(monthlyTotal)}원` : '-',
      highlight: true,
    },
    { label: 'NOC', value: '-' },
    { label: '실질 NOC', value: '-' },
    { label: '시설비', value: formatOneTimeFees(option.one_time_fees) },
    { label: '권리금', value: '-' },
    { label: '계약 기간', value: formatContractPeriod(option.contract_period_type, option.contract_period_value) },
    { label: '입주가능일', value: formatMoveInDate(option.move_in_date_type, option.move_in_date_value) },
    { label: '렌트프리', value: '-' },
    { label: '핏아웃', value: '-' },
    { label: 'TI (전용평당)', value: '-' },
    { label: '공동중개', value: 'N' },
  ];

  // 매물 상세 정보
  const detailRows = [
    { label: '특징', value: option.category2 ? formatCategory2(option.category2) : '-' },
    { label: '주차', value: (() => {
      if (!option.parking_type) return '-';
      const parts = [formatParkingType(option.parking_type)];
      if (option.parking_count) parts.push(`${option.parking_count}대`);
      if (option.parking_cost) parts.push(`비용 ${formatPrice(option.parking_cost)}원`);
      if (option.parking_note) parts.push(option.parking_note);
      return parts.join(', ');
    })() },
    { label: '인테리어', value: '-' },
    { label: '냉난방', value: formatHvacType(option.hvac_type) },
    { label: '화장실 구분', value: '-' },
    { label: '화장실 위치', value: '-' },
    { label: '층고', value: '-' },
    { label: '독립 공간 개수', value: '-' },
    {
      label: '매물 설명',
      value: option.office_info || option.memo || '-',
      colSpan: true,
    },
  ];

  // 매물 평가 정보
  const evaluationRows = [
    { label: '인테리어 등급', value: '확인 필요' },
    { label: '매물 추천', value: 'N' },
  ];

  // 크레딧 정보
  const creditRows = option.credits && option.credits.length > 0
    ? [{ label: '크레딧', value: formatCredits(option.credits), colSpan: true }]
    : [];

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
      {/* 이미지 영역 - 평면도 + 지점 사진 탭 */}
      {(floorPlanUrls.length > 0 || allBranchImages.length > 0) && (
        <div className="mb-6">
          <ImageGalleryTabs
            floorPlans={floorPlanUrls}
            branchImages={allBranchImages}
            onImageClick={onImageClick}
          />
        </div>
      )}

      {/* 매물 기본 정보 */}
      <InfoTable title="매물 기본 정보" rows={basicInfoRows} />

      {/* 매물 거래 정보 */}
      <InfoTable title="매물 거래 정보" rows={transactionRows} />

      {/* 매물 상세 정보 */}
      <InfoTable title="매물 상세 정보" rows={detailRows} />

      {/* 매물 평가 정보 */}
      <InfoTable title="매물 평가 정보" rows={evaluationRows} />

      {/* 크레딧 정보 */}
      {creditRows.length > 0 && (
        <InfoTable title="크레딧 정보" rows={creditRows} />
      )}

      {/* 매물 메모 */}
      {option.memo && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-bold text-gray-900">매물 메모</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">비공개</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
            {option.memo}
          </div>
        </div>
      )}

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
 * ImageGalleryTabs - 이미지 갤러리 탭 (평면도 / 지점 사진)
 */
const ImageGalleryTabs = ({ floorPlans, branchImages, onImageClick }) => {
  const hasBoth = floorPlans.length > 0 && branchImages.length > 0;

  if (!hasBoth) {
    const images = floorPlans.length > 0 ? floorPlans : branchImages;
    const title = floorPlans.length > 0 ? '옵션 평면도' : '지점 사진';
    return <ImageGallery images={images} title={title} onImageClick={onImageClick} />;
  }

  return (
    <div>
      <ImageGallery
        images={[...floorPlans, ...branchImages]}
        title="매물 내부 사진"
        onImageClick={onImageClick}
      />
    </div>
  );
};

export default OptionInfoTab;
