import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';

// Main Pages
import MainPage from './pages/main/MainPage';
import OptionRegister from './pages/options/OptionRegister';
import OptionEdit from './pages/options/OptionEdit';
import ProfilePage from './pages/ProfilePage';
import MyOptionsPage from './pages/MyOptionsPage';

// Proposal Pages
import ProposalCreate from './pages/proposals/ProposalCreate';
import ProposalListPage from './pages/proposals/ProposalListPage';

// Request Pages
import ProposalRequestCreate from './pages/requests/ProposalRequestCreate';
import ProposalRequestList from './pages/requests/ProposalRequestList';
import ProposalRequestDetail from './pages/requests/ProposalRequestDetail';

// Route Components
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import BrandManagement from './pages/admin/BrandManagement';
import ManagerManagement from './pages/admin/ManagerManagement';
import BranchManagement from './pages/admin/BranchManagement';
import DeleteRequestManagement from './pages/admin/DeleteRequestManagement';
import UserManagement from './pages/admin/UserManagement';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
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
              <Route path="/proposals/create" element={<ProposalCreate />} />
              <Route path="/proposals" element={<ProposalListPage />} />
              <Route path="/requests" element={<ProposalRequestList />} />
              <Route path="/requests/create" element={<ProposalRequestCreate />} />
              <Route path="/requests/:id" element={<ProposalRequestDetail />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-options" element={<MyOptionsPage />} />
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
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
