import { useState, useEffect } from 'react';

const SearchBar = ({ onSearchChange }) => {
  const [search, setSearch] = useState('');
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    // Debounce 500ms
    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => {
      onSearchChange(search);
    }, 500);

    setTimer(newTimer);

    return () => clearTimeout(newTimer);
  }, [search, onSearchChange]);

  return (
    <div className="px-4 md:px-8 py-3 md:py-4 bg-white">
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 브랜드, 지점, 옵션명으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
