import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const navIcons = {
  '/': (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  ),
  '/my-options': (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
  ),
  '/requests': (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ),
  '/proposals': (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
  ),
};

const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(true);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isAdminSection = location.pathname.startsWith('/admin');

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

  const adminSubItems = [
    { label: '대시보드', path: '/admin' },
    { label: '브랜드 관리', path: '/admin/brands' },
    { label: '매니저 관리', path: '/admin/managers' },
    { label: '지점 관리', path: '/admin/branches' },
    { label: '사용자 관리', path: '/admin/users' },
    { label: '삭제요청 관리', path: '/admin/delete-requests' },
  ];

  return (
    <nav className="w-60 bg-white border-r border-gray-100 overflow-y-auto flex-shrink-0">
      <div className="p-3 pt-5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">메뉴</p>

        <div className="space-y-0.5">
          {mainNavItems.map((item) => {
            const active = isActive(item.path) && !isAdminSection;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 text-[13px] flex items-center gap-2.5 ${
                  active
                    ? 'bg-primary-50 text-primary-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <span className={active ? 'text-primary-500' : 'text-gray-400'}>
                  {navIcons[item.path] || <span className="w-[18px] h-[18px] block" />}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>

        {user.role === 'admin' && (
          <>
            <div className="my-4 mx-3 border-t border-gray-100" />

            <button
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 ${
                isAdminSection ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest">관리</p>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isAdminOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isAdminOpen && (
              <div className="mt-1 space-y-0.5">
                {adminSubItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 text-[13px] flex items-center gap-2.5 ${
                        active
                          ? 'bg-primary-50 text-primary-600 font-semibold'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-primary-500' : 'bg-gray-300'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
