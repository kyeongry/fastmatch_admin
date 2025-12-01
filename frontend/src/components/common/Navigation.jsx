import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const getNavItems = () => {
    if (user.role === 'admin') {
      return [
        { label: '메인', path: '/' },
        { label: '관리자', path: '/admin' },
        { label: '제안요청', path: '/requests' },
        { label: '제안서', path: '/proposals' },
      ];
    }
    return [
      { label: '메인', path: '/' },
      { label: '옵션관리', path: '/my-options' },
      { label: '제안요청', path: '/requests' },
      { label: '제안서', path: '/proposals' },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="w-64 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3">메뉴</h2>

        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {user.role === 'admin' && (
          <>
            <hr className="my-4 border-gray-200" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3">관리</h3>
            <div className="space-y-1">
              <button
                onClick={() => navigate('/admin/brands')}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive('/admin/brands')
                    ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                브랜드 관리
              </button>
              <button
                onClick={() => navigate('/admin/managers')}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive('/admin/managers')
                    ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                매니저 관리
              </button>
              <button
                onClick={() => navigate('/admin/branches')}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive('/admin/branches')
                    ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                지점 관리
              </button>
              <button
                onClick={() => navigate('/admin/delete-requests')}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive('/admin/delete-requests')
                    ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                삭제요청 관리
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
