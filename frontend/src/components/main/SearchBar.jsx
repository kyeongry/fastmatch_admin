import { useState } from 'react';

// 부모 컴포넌트(Header, MainPage 등)에서 onSearch 함수를 받아와야 검색이 동작합니다.
const SearchBar = ({ onSearch, initialValue = '' }) => {
  const [keyword, setKeyword] = useState(initialValue);

  // 검색 실행 함수
  const handleSearchAction = () => {
    if (onSearch) {
      console.log('검색 실행:', keyword); // [디버깅용] 콘솔 확인
      onSearch(keyword); 
    } else {
      console.error('검색 기능이 연결되지 않았습니다. (onSearch prop missing)');
    }
  };

  // 엔터 키 감지 함수
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchAction();
    }
  };

  return (
    <div className="relative w-full max-w-xl">
      {/* 돋보기 아이콘 (클릭 가능하도록 수정됨) */}
      <div 
        className="absolute inset-y-0 left-0 pl-3 flex items-center cursor-pointer hover:text-purple-700"
        onClick={handleSearchAction} 
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
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
        placeholder="브랜드, 지점, 옵션명으로 검색..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)} 
        onKeyDown={handleKeyDown} 
      />
    </div>
  );
};

export default SearchBar;
