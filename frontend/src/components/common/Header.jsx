import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SearchBar from '../main/SearchBar'; // SearchBar 컴포넌트 임포트

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 검색 기능 핸들러
  const handleSearch = (keyword) => {
    if (!keyword || keyword.trim() === '') {
      alert('검색어를 입력해주세요.');
      return;
    }

    console.log('검색 실행:', keyword);
    
    // [TODO] 실제 검색 로직을 여기에 작성하세요.
    // 예: 옵션 목록 페이지로 이동하며 검색어 전달
    // navigate(`/my-options?search=${encodeURIComponent(keyword)}`);
    
    // 현재는 작동 확인을 위해 알림창을 띄웁니다.
    alert(`"${keyword}" 검색을 시작합니다!`);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* 로고 */}
          <div
            className="flex items-center cursor-pointer flex-shrink-0"
            onClick={() => navigate('/')}
          >
            <img
              src="/fastmatch-logo.png"
              alt="FASTMATCH"
              className="h-6 object-contain"
            />
          </div>

          {/* 중앙 검색창 (SearchBar 추가됨) */}
          <div className="flex-1 max-w-xl mx-auto px-4 hidden md:block">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* 사용자 메뉴 */}
          {user && (
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">
                      {user.name?.charAt(0) || '👤'}
                    </span>
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isMenuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* 드롭다운 메뉴 */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-fadeIn">
                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        navigate('/admin');
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      ⚙️ 관리자 대시보드
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    👤 내 정보
                  </button>
                  <button
                    onClick={() => {
                      navigate('/my-options');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    📋 내가 등록한 옵션
                  </button>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    🚪 로그아웃
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
