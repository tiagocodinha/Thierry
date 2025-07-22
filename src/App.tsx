import React, { useState } from 'react';
import { useEffect } from 'react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Navigation from './components/Layout/Navigation';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'admin'>('dashboard');
  const [isResetPassword, setIsResetPassword] = useState(false);

  useEffect(() => {
    // Verificar se é uma página de reset de password baseado na URL
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const hasRecoveryParams = urlParams.get('type') === 'recovery' || urlParams.get('token');
    const isAuthCallback = path === '/auth/callback';
    
    if (path === '/reset-password' || hasRecoveryParams || isAuthCallback) {
      setIsResetPassword(true);
    } else {
      setIsResetPassword(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se for página de reset de password, mostrar essa página
  if (isResetPassword) {
    const path = window.location.pathname;
    if (path === '/auth/callback') {
      return <AuthCallbackPage />;
    }
    return <ResetPasswordPage />;
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'admin':
        return user.role === 'admin' ? <AdminPage /> : <DashboardPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1">
        {renderCurrentPage()}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;