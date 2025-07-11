import { create } from 'zustand';
import { AuthError } from '@supabase/supabase-js';
import { AuthService, AuthState } from '../services/authService';

interface AuthStore extends AuthState {
  // Actions
  initializeAuth: () => Promise<void>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: AuthError | null }>;
  verifyPhoneOTP: (
    phone: string,
    token: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, _get) => ({
  // Initial state
  user: null,
  session: null,
  loading: false,
  error: null,

  // Actions
  initializeAuth: async () => {
    set({ loading: true, error: null });

    try {
      // Initialize anonymous auth for offline-first experience
      const user = await AuthService.initializeAnonymousAuth();
      const session = await AuthService.getCurrentSession();

      set({ user, session, loading: false });

      // Set up auth state listener
      AuthService.onAuthStateChange((event, session) => {
        set({ session, user: session?.user ?? null });
      });
    } catch (error) {
      set({
        error: error as AuthError,
        loading: false,
      });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });

    try {
      const { user, error } = await AuthService.signUp(email, password);

      if (error) {
        set({ error, loading: false });
        return { error };
      }

      set({ user, loading: false });
      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      set({ error: authError, loading: false });
      return { error: authError };
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });

    try {
      const { user, error } = await AuthService.signIn(email, password);

      if (error) {
        set({ error, loading: false });
        return { error };
      }

      set({ user, loading: false });
      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      set({ error: authError, loading: false });
      return { error: authError };
    }
  },

  signInWithPhone: async (phone: string) => {
    set({ loading: true, error: null });

    try {
      const { error } = await AuthService.signInWithPhone(phone);

      set({ loading: false, error });
      return { error };
    } catch (error) {
      const authError = error as AuthError;
      set({ error: authError, loading: false });
      return { error: authError };
    }
  },

  verifyPhoneOTP: async (phone: string, token: string) => {
    set({ loading: true, error: null });

    try {
      const { user, error } = await AuthService.verifyPhoneOTP(phone, token);

      if (error) {
        set({ error, loading: false });
        return { error };
      }

      set({ user, loading: false });
      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      set({ error: authError, loading: false });
      return { error: authError };
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });

    try {
      const { error } = await AuthService.signOut();

      if (error) {
        set({ error, loading: false });
        return;
      }

      set({ user: null, session: null, loading: false });
    } catch (error) {
      set({
        error: error as AuthError,
        loading: false,
      });
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null });

    try {
      const { error } = await AuthService.resetPassword(email);

      set({ loading: false, error });
      return { error };
    } catch (error) {
      const authError = error as AuthError;
      set({ error: authError, loading: false });
      return { error: authError };
    }
  },

  updatePassword: async (password: string) => {
    set({ loading: true, error: null });

    try {
      const { error } = await AuthService.updatePassword(password);

      set({ loading: false, error });
      return { error };
    } catch (error) {
      const authError = error as AuthError;
      set({ error: authError, loading: false });
      return { error: authError };
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
