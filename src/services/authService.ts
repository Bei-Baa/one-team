import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User, Session, AuthError } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  position?: string;
  department?: string;
  isOnline?: boolean;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  needsEmailVerification: boolean;
}

export class AuthService {
  /**
   * Register with email and password
   */
  async signUp(email: string, password: string, fullName: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Log in with email and password
   */
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out current user
   */
  async signOut() {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.warn('Supabase signOut notice:', error.message);
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/#reset-password` : undefined,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Update password (after reset link followed)
   */
  async updatePassword(newPassword: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get current active session
   */
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /**
   * Fetch user profile from PostgreSQL
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        fullName: data.full_name || '',
        email: data.email || '',
        avatarUrl: data.avatar_url || '',
        position: data.position || 'Специалист',
        department: data.department || 'Общий',
        isOnline: Boolean(data.is_online),
      };
    } catch {
      return null;
    }
  }

  /**
   * Update profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;

    const dbPayload: Record<string, any> = {};
    if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
    if (updates.avatarUrl !== undefined) dbPayload.avatar_url = updates.avatarUrl;
    if (updates.position !== undefined) dbPayload.position = updates.position;
    if (updates.department !== undefined) dbPayload.department = updates.department;
    if (updates.isOnline !== undefined) dbPayload.is_online = updates.isOnline;
    dbPayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(dbPayload)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      avatarUrl: data.avatar_url,
      position: data.position,
      department: data.department,
      isOnline: data.is_online,
    };
  }
}

export const authService = new AuthService();
