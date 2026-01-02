import { useEffect, useState } from 'react';
import { Navigate, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { applyPrimaryColor } from '@/utils/color';

// Layout & Shell Components
import Layout from '@/components/layout/Layout';
import Dashboard from '@/components/Dashboard';

// Page Components
import AssetsPage from '@/pages/AssetsPage';
import CompanyManagement from '@/components/CompanyManagement';
import UserManagement from '@/components/UserManagement';
import AuditReporting from '@/components/AuditReporting';
import AdminSettings from '@/components/AdminSettings';
import Profile from '@/components/Profile';
import AuthPage from '@/components/AuthPage';
import OIDCCallback from '@/components/OIDCCallback';
import CompleteProfile from '@/components/CompleteProfile';
import ForgotPassword from '@/components/ForgotPassword';
import ResetPassword from '@/components/ResetPassword';
import AttestationPage from '@/pages/AttestationPage';
import MyAttestationsPage from '@/pages/MyAttestationsPage';

// UI Components
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading, isAuthenticated } = useAuth();
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  
  const location = useLocation();

  // 1. Global Branding Loader
  const loadBranding = async () => {
    try {
      const response = await fetch('/api/branding');
      if (!response.ok) return;
      const data = await response.json();
      
      if (data.logo_data) localStorage.setItem('branding_logo', data.logo_data);
      if (data.primary_color) applyPrimaryColor(data.primary_color);
      if (data.site_name) document.title = data.site_name;
      if (data.footer_label) localStorage.setItem('footer_label', data.footer_label);
    } catch (error) {
      console.error('Failed to load branding:', error);
    }
  };

  useEffect(() => {
    loadBranding();
    const handleBrandingUpdate = () => loadBranding();
    window.addEventListener('brandingUpdated', handleBrandingUpdate);
    return () => window.removeEventListener('brandingUpdated', handleBrandingUpdate);
  }, []);

  // 2. Theme Manager
  useEffect(() => {
    const root = document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 3. Early Returns for Public Routes
  if (location.pathname === '/auth/callback') return <OIDCCallback />;
  if (location.pathname === '/forgot-password') return <ForgotPassword />;
  if (location.pathname.startsWith('/reset-password/')) return <ResetPassword />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground animate-pulse font-medium">Securing Session...</span>
        </div>
      </div>
    );
  }

  // 4. Auth Logic
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/register" element={<AuthPage initialMode="register" />} />
        <Route path="*" element={<AuthPage initialMode="login" />} />
      </Routes>
    );
  }

  if (user && (user.profile_complete === 0 || user.profile_complete === false)) {
    return <CompleteProfile />;
  }

  return (
    <Routes>
      {/* 5. The Master Layout Wrapper */}
      <Route element={<Layout theme={theme} setTheme={setTheme} />}>
        {/* All routes inside here will render inside the Layout's <Outlet /> */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/my-attestations" element={<MyAttestationsPage />} />
        <Route path="/profile" element={<Profile />} />

        {/* Role-Protected Management Routes */}
        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'coordinator') && (
          <>
            <Route path="/companies" element={<CompanyManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/audit" element={<AuditReporting />} />
            <Route path="/attestation" element={<AttestationPage />} />
          </>
        )}

        {/* Admin-Only Routes */}
        {user?.role === 'admin' && (
          <Route path="/admin" element={<AdminSettings />} />
        )}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
