import { useState, useEffect, useRef } from 'react';

// 부모 컴포넌트(Header, MainPage 등)에서 onSearch 함수를 받아와야 검색이 동작합니다.
const SearchBar = ({ onSearch }) => {
  // 페이지 이동 후 돌아오면 초기화되도록 항상 빈 문자열로 시작
  const [keyword, setKeyword] = useState('');
  const isFirstRender = useRef(true);

  // Debounce: 입력 완료 후 1초 후에 자동 검색 실행
  useEffect(() => {
    // 첫 렌더링 시에는 검색 실행하지 않음
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const debounceTimer = setTimeout(() => {
      if (onSearch) {
        console.log('자동 검색 실행 (1초 debounce):', keyword);
        onSearch(keyword);
      }
    }, 1000);

    // cleanup: 새 입력이 들어오면 이전 타이머 취소
    return () => clearTimeout(debounceTimer);
  }, [keyword, onSearch]);

  // X 버튼 클릭 시 텍스트 초기화
  const handleClear = () => {
    setKeyword('');
  };

  return (
    <div className="relative w-full max-w-xl">
      {/* 돋보기 아이콘 */}
      <div
        className="absolute inset-y-0 left-0 pl-3 flex items-center"
        title="검색"
      >
        <svg
          className="h-5 w-5 text-purple-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* 입력창 */}
      <input
        type="text"
        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
        placeholder="브랜드, 지점, 옵션명으로 검색..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {/* X 버튼 (텍스트가 있을 때만 표시) */}
      {keyword && (
        <div
          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
          onClick={handleClear}
          title="검색어 지우기"
        >
          <svg
            className="h-5 w-5 text-gray-400 hover:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
