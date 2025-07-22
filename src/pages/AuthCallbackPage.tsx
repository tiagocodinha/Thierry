import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen } from 'lucide-react';

const AuthCallbackPage: React.FC = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Processar callback do Google OAuth
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro no callback:', error);
          // Redirecionar para login com erro
          window.location.href = '/?error=auth_failed';
          return;
        }

        if (data.session?.user) {
          // Verificar se o perfil já existe
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .single();

          // Se não existe perfil, criar um
          if (!existingProfile) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email || '',
                name: data.session.user.user_metadata?.full_name || 
                      data.session.user.user_metadata?.name || 
                      data.session.user.email?.split('@')[0] || 
                      'Utilizador',
                role: 'user'
              });

            if (profileError) {
              console.error('Erro ao criar perfil:', profileError);
            }
          }

          // Redirecionar para dashboard
          window.location.href = '/';
        } else {
          // Sem sessão, redirecionar para login
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Erro no callback:', error);
        window.location.href = '/?error=auth_failed';
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