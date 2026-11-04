import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { authService, LocalUserProfile } from '../services/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: LocalUserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<LocalUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = authService.isConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Restore existing session
    authService.getSession().then((initialSession) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        const localProf = authService.resolveOrCreateLocalProfile(initialSession.user);
        setProfile(localProf);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          const localProf = authService.resolveOrCreateLocalProfile(currentSession.user);
          setProfile(localProf);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isConfigured]);

  const login = async (email: string, password: string) => {
    const res = await authService.signIn(email, password);
    if (res.user) {
      setUser(res.user);
      setSession(res.session);
      const prof = authService.resolveOrCreateLocalProfile(res.user);
      setProfile(prof);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    return await authService.signUp(email, password, fullName);
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    await authService.resetPasswordForEmail(email);
  };

  const updatePassword = async (password: string) => {
    await authService.updatePassword(password);
  };

  const resendVerification = async (email: string) => {
    await authService.resendVerificationEmail(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured,
        login,
        register,
        logout,
        resetPassword,
        updatePassword,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
