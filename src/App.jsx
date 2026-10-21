import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/useAuthStore';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import UserShell from './components/user/UserShell';

// ── Admin Portal Pages ──────────────────────────────
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const MapPage      = lazy(() => import('./pages/Map'));
const Sensors      = lazy(() => import('./pages/Sensors'));
const NodeDetail   = lazy(() => import('./pages/Sensors/NodeDetail'));
const Alerts       = lazy(() => import('./pages/Alerts'));
const Prediction   = lazy(() => import('./pages/Prediction'));
const Purification = lazy(() => import('./pages/Purification'));
const Drone        = lazy(() => import('./pages/Drone'));
const Rescue       = lazy(() => import('./pages/Rescue'));
const Reports      = lazy(() => import('./pages/Reports'));
const Settings     = lazy(() => import('./pages/Settings'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const Login        = lazy(() => import('./pages/Auth/Login'));

// ── User Portal Pages ───────────────────────────────
const UserDashboard  = lazy(() => import('./pages/User/Dashboard'));
const UserAlerts     = lazy(() => import('./pages/User/Alerts'));
const UserMap        = lazy(() => import('./pages/User/Map'));
const UserSOS        = lazy(() => import('./pages/User/SOS'));
const UserStatus     = lazy(() => import('./pages/User/Status'));
const UserContacts   = lazy(() => import('./pages/User/Contacts'));
const UserEvacuation = lazy(() => import('./pages/User/Evacuation'));
const UserProfile    = lazy(() => import('./pages/User/Profile'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30000,
      retry:                2,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      <span className="text-[13px] text-[#64748B]">Loading...</span>
    </div>
  </div>
);

// ── Admin Route Guard ───────────────────────────────
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isUserRole      = useAuthStore((s) => s.isUserRole);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Citizens cannot access admin portal
  if (isUserRole()) return <Navigate to="/user/dashboard" replace />;

  return (
    <AppShell>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppShell>
  );
};

// ── User Route Guard ────────────────────────────────
const UserRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdminRole     = useAuthStore((s) => s.isAdminRole);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // If admin tries to access user portal, redirect to admin dashboard
  if (isAdminRole()) return <Navigate to="/dashboard" replace />;

  return <UserShell>{children}</UserShell>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/"     element={<Navigate to="/dashboard" replace />} />

            {/* ── Admin Portal Routes ──────────────────── */}
            <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/map"             element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/sensors"         element={<ProtectedRoute><Sensors /></ProtectedRoute>} />
            <Route path="/sensors/:nodeId" element={<ProtectedRoute><NodeDetail /></ProtectedRoute>} />
            <Route path="/alerts"          element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/prediction"      element={<ProtectedRoute><Prediction /></ProtectedRoute>} />
            <Route path="/purification"    element={<ProtectedRoute><Purification /></ProtectedRoute>} />
            <Route path="/drone"           element={<ProtectedRoute><Drone /></ProtectedRoute>} />
            <Route path="/rescue"          element={<ProtectedRoute><Rescue /></ProtectedRoute>} />
            <Route path="/reports"         element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings/*"      element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/system-health"  element={<ProtectedRoute><SystemHealth /></ProtectedRoute>} />

            {/* ── User Portal Routes ──────────────────── */}
            <Route path="/user/dashboard"  element={<UserRoute><UserDashboard /></UserRoute>} />
            <Route path="/user/alerts"     element={<UserRoute><UserAlerts /></UserRoute>} />
            <Route path="/user/map"        element={<UserRoute><UserMap /></UserRoute>} />
            <Route path="/user/sos"        element={<UserRoute><UserSOS /></UserRoute>} />
            <Route path="/user/status"     element={<UserRoute><UserStatus /></UserRoute>} />
            <Route path="/user/contacts"   element={<UserRoute><UserContacts /></UserRoute>} />
            <Route path="/user/evacuation" element={<UserRoute><UserEvacuation /></UserRoute>} />
            <Route path="/user/profile"    element={<UserRoute><UserProfile /></UserRoute>} />

            <Route path="*"                element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background:   '#FFFFFF',
              color:        '#0F172A',
              border:       '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize:     '13px',
              fontFamily:   'Inter, system-ui, sans-serif',
              boxShadow:    '0 4px 6px -1px rgba(15,23,42,0.07)',
              padding:      '10px 14px',
            },
            success: { iconTheme: { primary: '#059669', secondary: '#ECFDF5' } },
            error:   { iconTheme: { primary: '#DC2626', secondary: '#FEF2F2' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
