import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../features/auth/services/authService';
import type { AuthState } from '../types/auth';
import { logger } from '../utils/logger';

// Types
export interface AuthStoreState {
  user: AuthState['user'];
  session: AuthState['session'];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface AuthStoreActions {
  setUser: (user: AuthState['user']) => void;
  setSession: (session: AuthState['session']) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;

  // Initialization
  initializeAuth: () => Promise<void>;
  subscribeToAuthChanges: () => () => void;
}

export type AuthStore = AuthStoreState & AuthStoreActions;

// Store
export const useAuthStore = create<AuthStore>()(
  persist(
    set => ({
      // Initial state
      user: null,
      session: null,
      isLoading: true,
      isInitialized: false,
      error: null,

      // State setters
      setUser: user => {
        set({ user, error: null });
      },

      setSession: session => {
        set({ session, error: null });
      },

      setLoading: loading => {
        set({ isLoading: loading });
      },

      setInitialized: initialized => {
        set({ isInitialized: initialized });
      },

      setError: error => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Auth actions
      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          await authService.signIn({ email, password });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Sign in failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true, error: null });
          await authService.signOut();
          set({ user: null, session: null, isLoading: false });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Sign out failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      signUp: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          await authService.signUp({ email, password });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Sign up failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          await authService.resetPassword(email);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Password reset failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Initialization
      initializeAuth: async () => {
        try {
          set({ isLoading: true, error: null });
          const session = await authService.getCurrentSession();
          set({
            user: session?.user ?? null,
            session,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          logger.error('Failed to initialize auth:', error);
          set({
            user: null,
            session: null,
            isLoading: false,
            isInitialized: true,
            error: 'Failed to initialize authentication',
          });
        }
      },

      subscribeToAuthChanges: () => {
        const {
          data: { subscription },
        } = authService.onAuthStateChange((_event: string, session: any) => {
          set({
            user: session?.user ?? null,
            session,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        });

        return () => {
          subscription.unsubscribe();
        };
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user and session, not loading/error states
      partialize: state => ({
        user: state.user,
        session: state.session,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

// Initialize auth store
export const initializeAuthStore = async () => {
  const store = useAuthStore.getState();

  try {
    await store.initializeAuth();
    const unsubscribe = store.subscribeToAuthChanges();

    // Return cleanup function
    return unsubscribe;
  } catch (error) {
    logger.error('Failed to initialize auth store:', error);
    return () => {}; // Return empty cleanup function
  }
};
