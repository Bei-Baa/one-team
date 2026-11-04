import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { authService, UserProfile } from '../services/authService';
import { workspaceService, Workspace, WorkspaceMember } from '../services/workspaceService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentRole: 'owner' | 'admin' | 'editor' | 'viewer';
  isLoading: boolean;
  needsEmailVerification: boolean;
  setNeedsEmailVerification: (val: boolean) => void;
  signUp: (email: string, pass: string, name: string) => Promise<any>;
  signIn: (email: string, pass: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (pass: string) => Promise<any>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string, description?: string, avatar?: string) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentRole, setCurrentRole] = useState<'owner' | 'admin' | 'editor' | 'viewer'>('owner');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsEmailVerification, setNeedsEmailVerification] = useState<boolean>(false);

  const loadUserWorkspaces = useCallback(async (userId: string) => {
    try {
      const list = await workspaceService.getUserWorkspaces(userId);
      setWorkspaces(list);

      const savedWsId = typeof localStorage !== 'undefined' ? localStorage.getItem('oneteam_active_ws_id') : null;
      let matched = list.find((w) => w.id === savedWsId);
      if (!matched && list.length > 0) {
        matched = list[0];
      }

      if (matched) {
        setCurrentWorkspace(matched);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('oneteam_active_ws_id', matched.id);
        }
        // Fetch role in current workspace
        const members = await workspaceService.getWorkspaceMembers(matched.id);
        const myMember = members.find((m) => m.userId === userId);
        if (myMember) {
          setCurrentRole(myMember.role);
        }
      } else {
        setCurrentWorkspace(null);
      }
    } catch (err) {
      console.warn('Failed to load workspaces:', err);
    }
  }, []);

  const loadUserProfile = useCallback(async (u: User) => {
    let p = await authService.getProfile(u.id);
    if (!p) {
      p = {
        id: u.id,
        fullName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Пользователь',
        email: u.email || '',
        avatarUrl: u.user_metadata?.avatar_url || '',
        position: 'Специалист',
        department: 'Общий',
        isOnline: true,
      };
    }
    setProfile(p);
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function initSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (data?.session?.user) {
          setSession(data.session);
          setUser(data.session.user);
          await loadUserProfile(data.session.user);
          await loadUserWorkspaces(data.session.user.id);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setWorkspaces([]);
          setCurrentWorkspace(null);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    // Listen to Supabase Auth State Changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED' ||
          event === 'PASSWORD_RECOVERY'
        ) {
          if (currentSession?.user) {
            setSession(currentSession);
            setUser(currentSession.user);
            await loadUserProfile(currentSession.user);
            await loadUserWorkspaces(currentSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setWorkspaces([]);
          setCurrentWorkspace(null);
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('oneteam_active_ws_id');
          }
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [loadUserProfile, loadUserWorkspaces]);

  const signUp = async (email: string, pass: string, name: string) => {
    const res = await authService.signUp(email, pass, name);
    // If confirmation is required, user is created without active session
    if (res.user && !res.session) {
      setNeedsEmailVerification(true);
    }
    return res;
  };

  const signIn = async (email: string, pass: string) => {
    const res = await authService.signIn(email, pass);
    if (res.user) {
      setUser(res.user);
      setSession(res.session);
      await loadUserProfile(res.user);
      await loadUserWorkspaces(res.user.id);
    }
    return res;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('oneteam_active_ws_id');
    }
    // Evict Service Worker caches on sign-out to guarantee zero cross-session data leaks
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'LOGOUT_PURGE' });
    }
  };

  const resetPassword = async (email: string) => {
    return authService.resetPassword(email);
  };

  const updatePassword = async (newPass: string) => {
    return authService.updatePassword(newPass);
  };

  const switchWorkspace = async (workspaceId: string) => {
    const target = workspaces.find((w) => w.id === workspaceId);
    if (target && user) {
      setCurrentWorkspace(target);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('oneteam_active_ws_id', target.id);
      }
      const members = await workspaceService.getWorkspaceMembers(target.id);
      const myMember = members.find((m) => m.userId === user.id);
      if (myMember) {
        setCurrentRole(myMember.role);
      }
    }
  };

  const createWorkspace = async (name: string, description = '', avatar = '⚡'): Promise<Workspace> => {
    const ws = await workspaceService.createWorkspace(name, description, avatar);
    if (user) {
      await loadUserWorkspaces(user.id);
    }
    setCurrentWorkspace(ws);
    setCurrentRole('owner');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('oneteam_active_ws_id', ws.id);
    }
    return ws;
  };

  const refreshWorkspaces = async () => {
    if (user) {
      await loadUserWorkspaces(user.id);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await authService.updateProfile(user.id, updates);
    if (updated) {
      setProfile(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        workspaces,
        currentWorkspace,
        currentRole,
        isLoading,
        needsEmailVerification,
        setNeedsEmailVerification,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        switchWorkspace,
        createWorkspace,
        refreshWorkspaces,
        updateProfile,
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
