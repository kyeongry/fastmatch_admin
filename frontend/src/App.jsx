import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// Route Components (항상 필요하므로 정적 import)
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Auth Pages (lazy)
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));

// Main Pages (lazy)
const MainPage = lazy(() => import('./pages/main/MainPage'));
const OptionRegister = lazy(() => import('./pages/options/OptionRegister'));
const OptionEdit = lazy(() => import('./pages/options/OptionEdit'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MyOptionsPage = lazy(() => import('./pages/MyOptionsPage'));

// Proposal Pages (lazy)
const ProposalListPage = lazy(() => import('./pages/proposals/ProposalListPage'));

// Request Pages (lazy)
const ProposalRequestCreate = lazy(() => import('./pages/requests/ProposalRequestCreate'));
const ProposalRequestList = lazy(() => import('./pages/requests/ProposalRequestList'));
const ProposalRequestDetail = lazy(() => import('./pages/requests/ProposalRequestDetail'));

// Lease Pages (lazy)
const LeaseListPage = lazy(() => import('./pages/lease/LeaseListPage'));
const LeaseCreatePage = lazy(() => import('./pages/lease/LeaseCreatePage'));
import { LeaseContractProvider } from './context/LeaseContractContext';

// Admin Pages (lazy)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const BrandManagement = lazy(() => import('./pages/admin/BrandManagement'));
const ManagerManagement = lazy(() => import('./pages/admin/ManagerManagement'));
const BranchManagement = lazy(() => import('./pages/admin/BranchManagement'));
const DeleteRequestManagement = lazy(() => import('./pages/admin/DeleteRequestManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));

// 페이지 로딩 스피너
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-sm text-gray-500 font-medium">로딩 중...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainPage />} />
              <Route path="/options/register" element={<OptionRegister />} />
              <Route path="/options/edit/:id" element={<OptionEdit />} />
              <Route path="/proposals" element={<ProposalListPage />} />
              <Route path="/requests" element={<ProposalRequestList />} />
              <Route path="/requests/create" element={<ProposalRequestCreate />} />
              <Route path="/requests/:id" element={<ProposalRequestDetail />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-options" element={<MyOptionsPage />} />

              {/* Lease Routes */}
              <Route path="/lease" element={<LeaseListPage />} />
              <Route
                path="/lease/create"
                element={
                  <LeaseContractProvider>
                    <LeaseCreatePage />
                  </LeaseContractProvider>
                }
              />
              <Route
                path="/lease/edit/:id"
                element={
                  <LeaseContractProvider>
                    <LeaseCreatePage />
                  </LeaseContractProvider>
                }
              />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/brands" element={<BrandManagement />} />
              <Route path="/admin/managers" element={<ManagerManagement />} />
              <Route path="/admin/branches" element={<BranchManagement />} />
              <Route path="/admin/delete-requests" element={<DeleteRequestManagement />} />
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
