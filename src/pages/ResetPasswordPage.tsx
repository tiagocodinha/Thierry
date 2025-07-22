import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 Verificando sessão de recovery...');
        
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        console.log('📋 Parâmetros da URL:', { 
          token: !!token, 
          type, 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken 
        });
        
        // Se temos tokens de acesso, definir a sessão
        if (accessToken && refreshToken) {
          console.log('🔑 Definindo sessão com tokens...');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('❌ Erro ao definir sessão:', error);
            setError('Link de recuperação inválido ou expirado.');
          } else {
            console.log('✅ Sessão definida com sucesso');
            setValidSession(true);
          }
        }
        // Se temos token hash, verificar OTP
        else if (type === 'recovery' && token) {
          console.log('🔐 Verificando token de recovery...');
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });
          
          if (error) {
            console.error('❌ Erro ao verificar token:', error);
            setError('Link de recuperação inválido ou expirado.');
          } else {
            console.log('✅ Token verificado com sucesso');
            setValidSession(true);
          }
        } else {
          // Verificar se já há uma sessão ativa
          console.log('🔍 Verificando sessão existente...');
          const { data: { session } } = await supabase.auth.getSession();
          console.log('📊 Sessão atual:', !!session);
          if (session) {
            setValidSession(true);
          } else {
            setError('Link de recuperação inválido ou expirado.');
          }
        }
      } catch (error) {
        console.error('💥 Erro ao verificar sessão:', error);
        setError('Erro ao verificar link de recuperação.');
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Iniciando atualização de password...');
    
    setError('');
    setLoading(true);

    // Validações
    if (password !== confirmPassword) {
      setError('As passwords não coincidem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Chamando updateUser...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      console.log('📊 Resposta do updateUser:', { data: !!data, error });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        setError(`Erro ao atualizar password: ${error.message}`);
      } else {
        console.log('✅ Password atualizada com sucesso!');
        setSuccess(true);
        
        // Aguardar 2 segundos e redirecionar
        setTimeout(async () => {
          console.log('🔄 Fazendo logout e redirecionando...');
          try {
            await supabase.auth.signOut();
          } catch (logoutError) {
            console.error('⚠️ Erro no logout:', logoutError);
          }
          
          // Forçar redirecionamento
          window.location.href = '/';
        }, 2000);
      }
    } catch (err) {
      console.error('💥 Erro geral:', err);
      setError('Erro inesperado ao atualizar password');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: '' };
    if (password.length < 6) return { strength: 1, text: 'Fraca', color: 'text-red-500' };
    if (password.length < 8) return { strength: 2, text: 'Média', color: 'text-yellow-500' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, text: 'Forte', color: 'text-green-500' };
    }
    return { strength: 2, text: 'Média', color: 'text-yellow-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Loading inicial
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Thierry Santos</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verificando Link</h2>
            <p className="text-gray-600">
              A verificar o link de recuperação...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Página de sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Thierry Santos</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Atualizada!</h2>
            <p className="text-gray-600 mb-4">
              A sua password foi atualizada com sucesso.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Será redirecionado para a página de login em 2 segundos...
            </p>
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <button
              onClick={() => window.location.href = '/'}
              className="text-blue-600 hover:text-blue-700 text-sm underline"
            >
              Ir para login agora
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Link inválido
  if (!validSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Thierry Santos</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Inválido</h2>
            <p className="text-gray-600 mb-6">
              {error || 'O link de recuperação de password é inválido ou expirou.'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Por favor, solicite um novo link de recuperação na página de login.
            </p>
            <a
              href="/"
              className="inline-block bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-800 transition-all"
            >
              Voltar ao Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Formulário de nova password
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Thierry Santos</h1>
          </div>
          <p className="text-gray-600">Plataforma de Aprendizagem Online</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Nova Password</h2>
            <p className="mt-2 text-gray-600">Defina a sua nova password</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nova Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.strength === 1
                            ? 'bg-red-500 w-1/3'
                            : passwordStrength.strength === 2
                            ? 'bg-yellow-500 w-2/3'
                            : 'bg-green-500 w-full'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
                  placeholder="Confirme sua nova password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-500">As passwords não coincidem</p>
              )}
              {confirmPassword && password === confirmPassword && password.length > 0 && (
                <div className="mt-1 flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-sm text-green-500">Passwords coincidem</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || password !== confirmPassword || password.length < 6}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{loading ? 'Atualizando...' : 'Atualizar Password'}</span>
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Thierry Santos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;