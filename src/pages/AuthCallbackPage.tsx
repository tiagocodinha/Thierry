import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen } from 'lucide-react';

const AuthCallbackPage: React.FC = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processando callback do Google...');
        
        // Processar callback do Google OAuth
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError);
          // Redirecionar para login com erro
          window.location.href = '/?error=auth_failed';
          return;
        }

        console.log('Sessão obtida:', !!sessionData.session);
        
        if (sessionData.session?.user) {
          const user = sessionData.session.user;
          console.log('Utilizador encontrado:', user.email);
          
          // Verificar se o perfil já existe
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (profileCheckError && profileCheckError.code !== 'PGRST116') {
            console.error('Erro ao verificar perfil:', profileCheckError);
          }

          console.log('Perfil existente:', !!existingProfile);

          // Se não existe perfil, criar um
          if (!existingProfile) {
            console.log('Criando novo perfil...');
            
            const profileData = {
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.full_name || 
                    user.user_metadata?.name || 
                    user.email?.split('@')[0] || 
                    'Utilizador',
              role: 'user' as const
            };
            
            console.log('Dados do perfil:', profileData);
            
            const { error: profileError } = await supabase
              .from('profiles')
              .insert(profileData);

            if (profileError) {
              console.error('Erro ao criar perfil:', profileError);
            } else {
              console.log('Perfil criado com sucesso');
            }
          }

          console.log('Redirecionando para dashboard...');
          // Redirecionar para dashboard
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          console.log('Sem sessão, redirecionando para login...');
          // Sem sessão, redirecionar para login
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Erro no callback:', error);
        // Em caso de erro, tentar redirecionar mesmo assim
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    };

    handleAuthCallback();
  }, []);

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

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processando Login</h2>
          <p className="text-gray-600">
            A finalizar o seu login com Google...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Se demorar muito, será redirecionado automaticamente.
          </p>
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

export default AuthCallbackPage;