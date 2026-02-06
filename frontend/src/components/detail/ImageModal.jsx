import { useEffect, useState, useCallback } from 'react';

/**
 * ImageModal - 이미지 확대 모달 컴포넌트
 *
 * @param {string} selectedImage - 현재 선택된 이미지 URL
 * @param {Array<string>} gallery - 갤러리 이미지 배열
 * @param {number} initialIndex - 초기 이미지 인덱스
 * @param {function} onClose - 모달 닫기 콜백
 */
const ImageModal = ({ selectedImage, gallery = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const images = gallery.length > 0 ? gallery : (selectedImage ? [selectedImage] : []);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  if (!selectedImage && images.length === 0) return null;

  const displayImage = images[currentIndex] || selectedImage;
  if (!displayImage) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-80 z-[110]"
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center p-8"
        onClick={onClose}
      >
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:text-gray-300 transition bg-black bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center hover:bg-opacity-70"
          >
            &lsaquo;
          </button>
        )}

        <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 transition"
          >
            &times;
          </button>
          <img
            src={displayImage}
            alt="확대 이미지"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
          />
          {images.length > 1 && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:text-gray-300 transition bg-black bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center hover:bg-opacity-70"
          >
            &rsaquo;
          </button>
        )}
      </div>
    </>
  );
};

export default ImageModal;
