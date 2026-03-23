import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { DataProvider } from './src/contexts/DataContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import LoginForm from './components/LoginForm';
import CommandPalette from './src/components/CommandPalette';
import UserProfileHeader from './src/components/UserProfileHeader';

// ── Lazy-loaded pages (code splitting) ──
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CompanyManager = lazy(() => import('./pages/CompanyManager'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const PipelinePage = lazy(() => import('./pages/PipelinePage'));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage'));
const QuoteGenerator = lazy(() => import('./pages/QuoteGenerator'));
const ReportsPage = lazy(() => import('./src/pages/ReportsPage'));
const ProductCatalog = lazy(() => import('./src/pages/ProductCatalog'));
const CalendarPage = lazy(() => import('./src/pages/CalendarPage'));
const SettingsPage = lazy(() => import('./src/pages/SettingsPage'));
const AuditLogPage = lazy(() => import('./src/pages/AuditLogPage'));
const EmailCampaignPage = lazy(() => import('./src/pages/EmailCampaignPage'));
const UserManagementPage = lazy(() => import('./src/pages/UserManagementPage'));

// ── Loading fallback ──
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="text-center">
      <svg className="animate-spin h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando...</p>
    </div>
  </div>
);

// ── Protected route wrapper ──
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isPending, handleLogout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Pending approval screen
  if (isPending) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-10 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-2xl mb-6">
            <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Cuenta Pendiente de Aprobación</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Tu cuenta ha sido creada exitosamente. Un administrador debe aprobar tu acceso antes de que puedas utilizar el sistema.</p>
          <button onClick={handleLogout} className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// ── Main Layout ──
const AppLayout: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const { isDark } = useTheme();

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? '#1f2937' : '#fff',
            color: isDark ? '#e5e7eb' : '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderRadius: '0.75rem',
            padding: '16px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <CommandPalette />
      <div className="flex h-screen p-4 gap-4">
        <Sidebar />
        <div className="flex-1 h-full overflow-y-auto pr-2">
          <UserProfileHeader />
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/companies" element={<CompanyManager />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/quotes/new" element={<QuoteGenerator />} />
              <Route path="/quotes/:id/edit" element={<QuoteGenerator />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/products" element={<ProductCatalog />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/audit-log" element={<AuditLogPage />} />
              <Route path="/email" element={<EmailCampaignPage />} />
              <Route path="/users" element={<UserManagementPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </main>
  );
};

// ── App Root ──
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DataProvider>
                    <AppLayout />
                  </DataProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// ── Login Page Wrapper ──
const LoginPage: React.FC = () => {
  const { user, loading, login, register, handleResetPassword } = useAuth();

  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <LoginForm
      onLogin={login}
      onRegister={register}
      onResetPassword={handleResetPassword}
    />
  );
};

// ── UX-04: 404 Page ──
const NotFoundPage: React.FC = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">Página no encontrada</p>
      <a href="/dashboard" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-block">Ir al Dashboard</a>
    </div>
  </div>
);

export default App;
