import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(true);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isAdminSection = location.pathname.startsWith('/admin');

  // 메인 메뉴 아이템
  const mainNavItems = user.role === 'admin'
    ? [
        { label: '메인', path: '/' },
        { label: '제안요청', path: '/requests' },
        { label: '출력내역', path: '/proposals' },
      ]
    : [
        { label: '메인', path: '/' },
        { label: '옵션관리', path: '/my-options' },
        { label: '제안요청', path: '/requests' },
        { label: '출력내역', path: '/proposals' },
      ];

  // 관리 서브메뉴 아이템
  const adminSubItems = [
    { label: '대시보드', path: '/admin' },
    { label: '브랜드 관리', path: '/admin/brands' },
    { label: '매니저 관리', path: '/admin/managers' },
    { label: '지점 관리', path: '/admin/branches' },
    { label: '사용자 관리', path: '/admin/users' },
    { label: '삭제요청 관리', path: '/admin/delete-requests' },
  ];

  return (
    <nav className="w-64 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3">메뉴</h2>

        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(item.path) && !isAdminSection
                  ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 관리자 전용 - 관리 메뉴 그룹 */}
        {user.role === 'admin' && (
          <>
            <hr className="my-4 border-gray-200" />

            {/* 관리 탭 헤더 (접기/펼치기) */}
            <button
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                isAdminSection
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm font-semibold uppercase tracking-wider">관리</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isAdminOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 관리 서브메뉴 */}
            {isAdminOpen && (
              <div className="mt-2 ml-2 space-y-1">
                {adminSubItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                      location.pathname === item.path
                        ? 'bg-primary-50 text-primary-600 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
