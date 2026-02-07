import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Navigation from './Navigation';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleMobileNav = useCallback(() => {
    setIsMobileNavOpen((prev) => !prev);
  }, []);

  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header onToggleMobileNav={toggleMobileNav} isMobileNavOpen={isMobileNavOpen} />
      <div className="flex flex-1 overflow-hidden">
        {user && <Navigation isOpen={isMobileNavOpen} onClose={closeMobileNav} />}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
