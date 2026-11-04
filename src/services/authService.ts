import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { storageService, STORAGE_KEYS } from './storage';
import { TeamRole } from '../types';

export interface LocalUserProfile {
  id: string; // Supabase UUID
  email: string;
  fullName: string;
  role: TeamRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  isActive: boolean;
}

const LOCAL_PROFILES_KEY = 'oneteam_local_profiles_v1';
const BOOTSTRAP_STATE_KEY = 'oneteam_bootstrap_completed_v1';

class AuthService {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  }

  async getSession(): Promise<Session | null> {
    if (!this.isConfigured()) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  async signUp(email: string, password: string, fullName: string) {
    if (!this.isConfigured()) {
      throw new Error('Supabase Auth не настроен. Укажите VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в файле .env.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    if (!this.isConfigured()) {
      throw new Error('Supabase Auth не настроен. Укажите VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в файле .env.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    if (this.isConfigured()) {
      await supabase.auth.signOut();
    }
  }

  async resetPasswordForEmail(email: string) {
    if (!this.isConfigured()) {
      throw new Error('Supabase Auth не настроен.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#type=recovery`,
    });

    if (error) throw error;
  }

  async updatePassword(password: string) {
    if (!this.isConfigured()) {
      throw new Error('Supabase Auth не настроен.');
    }

    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
  }

  async resendVerificationEmail(email: string) {
    if (!this.isConfigured()) {
      throw new Error('Supabase Auth не настроен.');
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw error;
  }

  // --- Local User Profile & Safe First-User Bootstrap ---
  getLocalProfiles(): LocalUserProfile[] {
    try {
      const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveLocalProfile(profile: LocalUserProfile): void {
    const profiles = this.getLocalProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx !== -1) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
  }

  resolveOrCreateLocalProfile(user: User): LocalUserProfile {
    const profiles = this.getLocalProfiles();
    const existing = profiles.find((p) => p.id === user.id);
    const now = new Date().toISOString();

    if (existing) {
      const updated: LocalUserProfile = {
        ...existing,
        lastLoginAt: now,
        updatedAt: now,
      };
      this.saveLocalProfile(updated);
      return updated;
    }

    // First user bootstrap check
    const isBootstrapped = localStorage.getItem(BOOTSTRAP_STATE_KEY) === 'true';
    let assignedRole: TeamRole = 'member';

    if (!isBootstrapped && profiles.length === 0) {
      assignedRole = 'owner';
      localStorage.setItem(BOOTSTRAP_STATE_KEY, 'true');
    }

    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Пользователь';

    const newProfile: LocalUserProfile = {
      id: user.id,
      email: user.email || '',
      fullName,
      role: assignedRole,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      isActive: true,
    };

    this.saveLocalProfile(newProfile);

    // Sync into workspace settings currentUser without wiping other data
    const settings = storageService.getSettings();
    storageService.updateSettings({
      currentUser: {
        id: user.id,
        name: fullName,
        email: user.email || '',
        position: assignedRole === 'owner' ? 'Владелец пространства' : 'Участник',
        role: assignedRole,
        avatar: settings.currentUser.avatar || '',
      },
    });

    return newProfile;
  }
}

export const authService = new AuthService();
