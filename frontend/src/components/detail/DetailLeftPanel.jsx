import { useState } from 'react';
import { formatPrice, formatCategory1 } from '../../utils/formatters';
import ReviewBoard from './ReviewBoard';

/**
 * DetailLeftPanel - 좌측 탐색 패널
 * 지점 정보 (이미지, 주소, 지도, 사용승인일, 연식, 게시판) + 옵션 리스트 네비게이션
 */
const DetailLeftPanel = ({
  branch,
  branchOptions = [],
  selectedOptionId,
  onSelectOption,
  loadingOptions,
  onImageClick,
  isMobileInline = false,
}) => {
  const [showBranchInfo, setShowBranchInfo] = useState(true);
  const [showReviewBoard, setShowReviewBoard] = useState(true);

  const branchId = branch?.id || branch?._id;

  // 지점 이미지 모음
  const allBranchImages = [
    ...(branch?.exterior_image_url ? [branch.exterior_image_url] : []),
    ...(branch?.interior_image_urls || []),
  ];

  // 연식 계산
  const getBuildingAge = () => {
    if (!branch?.approval_year) return null;
    const currentYear = new Date().getFullYear();
    return currentYear - branch.approval_year;
  };

  // 카카오맵 링크
  const getKakaoMapUrl = () => {
    if (!branch?.latitude || !branch?.longitude) return null;
    return `https://map.kakao.com/link/map/${encodeURIComponent(branch.name || '지점')},${branch.latitude},${branch.longitude}`;
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { text: '활성', cls: 'bg-green-100 text-green-700' },
      completed: { text: '거래완료', cls: 'bg-gray-100 text-gray-600' },
      delete_requested: { text: '삭제요청', cls: 'bg-red-100 text-red-700' },
    };
    const badge = map[status] || { text: status, cls: 'bg-gray-100 text-gray-600' };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>
        {badge.text}
      </span>
    );
  };

  const buildingAge = getBuildingAge();
  const kakaoMapUrl = getKakaoMapUrl();

  return (
    <div className={isMobileInline
      ? 'w-full bg-white rounded-xl border border-gray-200 flex flex-col'
      : 'w-[320px] min-w-[320px] border-r border-gray-200 bg-white flex flex-col h-full'
    }>
      {/* 전체 스크롤 영역 */}
      <div className={isMobileInline ? '' : 'flex-1 overflow-y-auto'}>
        {/* ======== 지점 정보 섹션 ======== */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => setShowBranchInfo(!showBranchInfo)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
          >
            <h3 className="text-sm font-bold text-gray-900">지점 정보</h3>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${showBranchInfo ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showBranchInfo && branch && (
            <div className="p-4 space-y-4">
              {/* 지점 이미지 */}
              {allBranchImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {allBranchImages.slice(0, 4).map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition"
                      onClick={() => onImageClick && onImageClick(url, allBranchImages, idx)}
                    >
                      <img src={url} alt={`지점 사진 ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 3 && allBranchImages.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">+{allBranchImages.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center text-gray-400 text-xs">
                  등록된 지점 사진이 없습니다
                </div>
              )}

              {/* 브랜드/지점명 */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {branch.brand?.name && (
                    <span className="text-xs text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded">
                      {branch.brand.name}
                    </span>
                  )}
                  <span className="text-sm font-bold text-gray-900">{branch.name}</span>
                </div>
              </div>

              {/* 주소 */}
              {branch.address && (
                <div className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-medium text-gray-700">주소: </span>
                  {branch.address}
                </div>
              )}

              {/* 카카오맵 링크 */}
              {kakaoMapUrl && (
                <a
                  href={kakaoMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition text-xs"
                >
                  <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-yellow-700 font-medium">카카오맵에서 보기</span>
                </a>
              )}

              {/* 지점 상세 데이터 */}
              <div className="space-y-1.5 text-xs">
                {branch.approval_year && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">사용승인일</span>
                    <span className="font-medium text-gray-800">{branch.approval_year}년</span>
                  </div>
                )}
                {buildingAge !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">연식</span>
                    <span className="font-medium text-gray-800">{buildingAge}년</span>
                  </div>
                )}
                {branch.floors_above && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">층수</span>
                    <span className="font-medium text-gray-800">
                      지상 {branch.floors_above}층{branch.floors_below ? ` / 지하 ${branch.floors_below}층` : ''}
                    </span>
                  </div>
                )}
                {branch.total_area && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">연면적</span>
                    <span className="font-medium text-gray-800">{branch.total_area}㎡</span>
                  </div>
                )}
                {branch.nearest_subway && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">지하철</span>
                    <span className="font-medium text-gray-800">
                      {branch.nearest_subway} ({branch.is_transit ? '대중교통' : '도보'}{' '}
                      {branch.is_transit ? (branch.transit_distance || branch.walking_distance) : branch.walking_distance}분)
                    </span>
                  </div>
                )}
                {branch.branch_info && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-gray-600 leading-relaxed">
                    {branch.branch_info}
                  </div>
                )}
              </div>

              {/* 게시판 (리뷰) */}
              {branchId && (
                <div className="border-t border-gray-200 pt-3">
                  <button
                    onClick={() => setShowReviewBoard(!showReviewBoard)}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <span className="text-xs font-bold text-gray-700">게시판</span>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showReviewBoard ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showReviewBoard && (
                    <div className="text-xs">
                      <ReviewBoard branchId={branchId} compact />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showBranchInfo && !branch && (
            <div className="p-4 text-xs text-gray-400 text-center">지점 정보 없음</div>
          )}
        </div>

        {/* ======== 옵션 리스트 ======== */}
        <div>
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <h4 className="text-sm font-bold text-gray-900">옵션 목록</h4>
          </div>

          {loadingOptions ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          ) : branchOptions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              등록된 옵션이 없습니다
            </div>
          ) : (
            <div className="py-1">
              {branchOptions.map((opt) => {
                const optId = opt.id || opt._id;
                const isSelected = selectedOptionId === optId;

                return (
                  <button
                    key={optId}
                    onClick={() => onSelectOption(opt)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition ${
                      isSelected
                        ? 'bg-orange-50 border-l-3 border-l-orange-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-semibold ${
                          isSelected ? 'text-orange-700' : 'text-gray-800'
                        }`}
                      >
                        {opt.name || '이름 없음'}
                      </span>
                      {getStatusBadge(opt.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {opt.category1 && (
                        <span>{formatCategory1(opt.category1)}</span>
                      )}
                      {opt.capacity && <span>{opt.capacity}인</span>}
                      {opt.monthly_fee > 0 && (
                        <span className="text-orange-600 font-medium">
                          {formatPrice(opt.monthly_fee)}원
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 하단 옵션 수 표시 */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-center flex-shrink-0">
        <span className="text-xs text-gray-500">
          총 {branchOptions.length}개 옵션
        </span>
      </div>
    </div>
  );
};

export default DetailLeftPanel;
