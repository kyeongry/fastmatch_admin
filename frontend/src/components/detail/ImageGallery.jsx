import { useState } from 'react';

/**
 * ImageGallery - 이미지 갤러리 컴포넌트
 * 썸네일 리스트 + 메인 이미지 뷰어
 *
 * @param {Array<string>} images - 이미지 URL 배열
 * @param {string} title - 갤러리 제목
 * @param {function} onImageClick - 이미지 클릭 시 확대 모달 열기 콜백
 */
const ImageGallery = ({ images = [], title, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">등록된 이미지가 없습니다</span>
        </div>
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white bg-black bg-opacity-60 px-3 py-1 rounded">
            {title}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        {/* 썸네일 리스트 (세로) */}
        {images.length > 1 && (
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
            {images.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                  idx === currentIndex
                    ? 'border-orange-500 shadow-md'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={url}
                  alt={`thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* 메인 이미지 */}
        <div className="flex-1 relative">
          <div
            className="relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
            onClick={() => onImageClick && onImageClick(images[currentIndex], images, currentIndex)}
          >
            <img
              src={images[currentIndex]}
              alt={`image ${currentIndex + 1}`}
              className="w-full h-[400px] object-cover"
            />

            {/* 이미지 카운터 */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
              {currentIndex + 1}/{images.length}
            </div>

            {/* 네비게이션 버튼 */}
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
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;
