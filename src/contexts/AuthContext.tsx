import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Verificar sessão atual
    const getSession = async () => {
      try {
        console.log('Verificando sessão atual...');
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('Sessão encontrada:', !!session, session?.user?.email);
        
        if (!mounted) return;
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          console.log('Sem sessão ativa');
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          console.log('Finalizando carregamento...');
          setLoading(false);
        }
      }
    };

    // Timeout de segurança - se demorar mais de 10 segundos, para o loading
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Timeout de carregamento - forçando fim do loading');
        setLoading(false);
        setUser(null);
      }
    }, 10000);

    getSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session);
        
        if (!mounted) return;
        
        // Limpar timeout quando há mudança de estado
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        try {
          if (session?.user) {
            console.log('Utilizador logado, carregando perfil...');
            await loadUserProfile(session.user);
          } else {
            console.log('Utilizador deslogado');
            setUser(null);
          }
        } catch (error) {
          console.error('Erro no auth state change:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Carregando perfil para utilizador:', supabaseUser.id, supabaseUser.email);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      console.log('Perfil encontrado:', profile);
      console.log('Erro na consulta:', error);

      // Se não existe perfil, criar um
      if (!profile && !error) {
        console.log('Perfil não existe, criando novo...');
        
        const newProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || 
                supabaseUser.user_metadata?.name || 
                supabaseUser.email?.split('@')[0] || 
                'Utilizador',
          role: 'user' as const,
        };
        
        console.log('Dados do novo perfil:', newProfile);
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
        
        if (createError) {
          console.error('Erro ao criar perfil:', createError);
          // Mesmo com erro na criação, continuar com dados básicos
          const userData: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: newProfile.name,
            role: 'user',
            created_at: supabaseUser.created_at,
          };
          console.log('Usando dados básicos devido a erro:', userData);
          setUser(userData);
          return;
        } else {
          console.log('Perfil criado com sucesso:', createdProfile);
          const userData: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: createdProfile.name,
            phone: createdProfile.phone,
            role: createdProfile.role,
            created_at: createdProfile.created_at,
          };
          console.log('Dados do utilizador criado:', userData);
          setUser(userData);
          return;
        }
      }
      
      // Sempre criar um objeto de usuário, mesmo se não houver perfil
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuário',
        phone: profile?.phone,
        role: profile?.role || 'user',
        created_at: profile?.created_at || supabaseUser.created_at,
      };

      console.log('Dados finais do utilizador:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      
      // Mesmo com erro, criar um usuário básico
      const fallbackUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuário',
        role: 'user',
        created_at: supabaseUser.created_at,
      };
      
      console.log('Usando utilizador fallback:', fallbackUser);
      setUser(fallbackUser);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou password incorretos. Verifique os seus dados ou crie uma conta.');
      }
      throw new Error(error.message);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Se o registo foi bem-sucedido e temos um utilizador, criar o perfil
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            name: name,
            phone: phone || null,
          });
        
        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          // Não lançar erro aqui para não bloquear o registo
        }
      } catch (profileError) {
        console.error('Erro ao criar perfil:', profileError);
      }
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      },
    });

    if (error) {
      console.error('Erro no signInWithOAuth:', error);
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro no signOut:', error);
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Sempre limpar o estado do utilizador
      setUser(null);
      // Forçar reload da página para garantir limpeza completa
      window.location.href = '/';
    }
  };

  const resetPassword = async (email: string) => {
    // Determinar a URL base dependendo do ambiente
    const baseUrl = import.meta.env.PROD 
      ? window.location.origin 
      : window.location.origin;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    });
    if (error) {
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};