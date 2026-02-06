import { useState, useEffect, useRef } from 'react';

const SearchBar = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const debounceTimer = setTimeout(() => {
      if (onSearch) {
        onSearch(keyword);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [keyword, onSearch]);

  const handleClear = () => {
    setKeyword('');
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <input
        type="text"
        className="block w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 transition-all"
        placeholder="브랜드, 지점, 옵션명 검색..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {keyword && (
        <button
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
          onClick={handleClear}
          title="검색어 지우기"
        >
          <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
