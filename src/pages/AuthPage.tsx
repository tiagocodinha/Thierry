import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import ResetPasswordForm from '../components/Auth/ResetPasswordForm';

type AuthMode = 'login' | 'register' | 'reset';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Thierry Santos</h1>
          </div>
          <p className="text-gray-600">Plataforma de Aprendizagem Online</p>
        </div>

        {/* Forms */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {mode === 'login' && (
            <LoginForm
              onSwitchToRegister={() => setMode('register')}
              onSwitchToReset={() => setMode('reset')}
            />
          )}
          {mode === 'register' && (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}
          {mode === 'reset' && (
            <ResetPasswordForm onBack={() => setMode('login')} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Thierry Santos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;