import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  formatPrice,
  formatCategory1,
  formatCategory2,
  formatMoveInDate,
  formatContractPeriod,
} from '../../utils/formatters';

const OptionDetailSlide = ({ option, isOpen, onClose, onComplete, onReactivate, onCancelDeleteRequest }) => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageGallery, setImageGallery] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 상세창 ESC 키 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (e) => {
      // 이미지 모달이 열려있으면 상세창은 닫지 않음
      if (e.key === 'Escape' && !selectedImage) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, selectedImage, onClose]);

  // 키보드 이벤트 리스너
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'Escape') {
        closeImageModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImage, currentImageIndex, imageGallery]);

  if (!isOpen || !option) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatHvacType = (type) => {
    const map = {
      central: '중앙냉난방',
      individual: '개별냉난방',
    };
    return map[type] || type;
  };

  const formatParkingType = (type) => {
    const map = {
      self_parking: '자주식',
      mechanical: '기계식',
    };
    return map[type] || type;
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

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-[90]"
        onClick={onClose}
      />

      {/* 우측 슬라이드 패널 */}
      <div className="fixed right-0 top-0 h-full w-[700px] bg-white shadow-2xl overflow-y-auto z-[100]">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">상세 정보</h2>
          <div className="flex items-center gap-3">
            {/* 삭제요청 취소 버튼 (본인만 표시, delete_requested 상태일 때만) */}
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
            {/* 거래완료 버튼 (본인 또는 관리자만 표시, active 상태일 때만) */}
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
            {/* 거래재개 버튼 (본인 또는 관리자만 표시, completed 상태일 때만) */}
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
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-8 space-y-8">
          {/* 브랜드 - 지점 정보 */}
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
              <div className="flex">
                <span className="text-gray-600 w-32">옵션명:</span>
                <span className="font-semibold flex-1">{option.name}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-32">분류:</span>
                <span className="font-semibold flex-1">
                  {formatCategory1(option.category1)}
                  {option.category2 && ` / ${formatCategory2(option.category2)}`}
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-32">인실:</span>
                <span className="font-semibold flex-1">{option.capacity}인</span>
              </div>
            </div>
          </section>

          {/* 가격 정보 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">가격 정보</h3>
            <div className="space-y-3">
              <div className="flex">
                <span className="text-gray-600 w-32">월사용료:</span>
                <span className="font-semibold flex-1 text-lg text-primary-600">
                  {formatPrice(option.monthly_fee)}원
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-32">보증금:</span>
                <span className="font-semibold flex-1 text-lg text-primary-600">
                  {formatPrice(option.deposit)}원
                </span>
              </div>
              {option.list_price && (
                <div className="flex">
                  <span className="text-gray-600 w-32">정가:</span>
                  <span className="font-semibold flex-1">{formatPrice(option.list_price)}원</span>
                </div>
              )}
              {option.one_time_fees && option.one_time_fees.length > 0 && (
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
            </div>
          </section>

          {/* 추가 정보 */}
          {(option.hvac_type || option.parking_type || option.credits || option.office_info) && (
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">추가 정보</h3>
              <div className="space-y-3">
                {option.hvac_type && (
                  <div className="flex">
                    <span className="text-gray-600 w-32">냉난방:</span>
                    <span className="font-semibold flex-1">{formatHvacType(option.hvac_type)}</span>
                  </div>
                )}
                {option.parking_type && (
                  <div className="flex">
                    <span className="text-gray-600 w-32">주차:</span>
                    <span className="font-semibold flex-1">{formatParkingType(option.parking_type)}</span>
                  </div>
                )}
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
                {option.office_info && (
                  <div className="flex">
                    <span className="text-gray-600 w-32">오피스정보:</span>
                    <span className="flex-1 whitespace-pre-wrap">{option.office_info}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 메모 */}
          {option.memo && (
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">메모</h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {option.memo}
              </p>
            </section>
          )}

          {/* 사진 정보 - 맨 아래로 이동 */}
          {/* 옵션 평면도 */}
          {option.floor_plan_url && (
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">옵션 평면도</h3>
              <div className="flex flex-wrap gap-3">
                <img
                  src={option.floor_plan_url}
                  alt="옵션 평면도"
                  className="h-32 w-auto rounded-lg shadow-md cursor-pointer hover:opacity-80 transition object-cover"
                  onClick={() => handleImageClick(option.floor_plan_url)}
                />
              </div>
            </section>
          )}

          {/* 지점 이미지 - 외부 이미지 */}
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

          {/* 지점 이미지 - 내부 이미지들 */}
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
              {option.created_by && (
                <div>작성자: {option.created_by.name || option.created_by.email}</div>
              )}
              {option.created_at && (
                <div>등록일: {formatDate(option.created_at)}</div>
              )}
              {option.updated_at && option.updated_at !== option.created_at && (
                <div>수정일: {formatDate(option.updated_at)}</div>
              )}
            </div>
          </section>

          <div className="pb-6" />
        </div>
      </div>

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-80 z-[60]"
            onClick={closeImageModal}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
            {/* 좌측 화살표 */}
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

            {/* 이미지 */}
            <div className="relative max-w-7xl max-h-full">
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
                onClick={(e) => e.stopPropagation()}
              />
              {/* 이미지 카운터 */}
              {imageGallery.length > 1 && (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
                  {currentImageIndex + 1} / {imageGallery.length}
                </div>
              )}
            </div>

            {/* 우측 화살표 */}
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
