import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeMode } from '../types/theme';
import { themes } from '../constants/theme';
import { logger } from '../utils/logger';

// Types
export interface ThemeState {
  mode: ThemeMode;
  isLoading: boolean;
  error: string | null;
}

export interface ThemeActions {
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  getTheme: () => Theme;
}

export type ThemeStore = ThemeState & ThemeActions;

// Theme storage key
const THEME_STORAGE_KEY = '@theme_mode';

// Store
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'light',
      isLoading: true,
      error: null,

      // Actions
      setTheme: (mode: ThemeMode) => {
        set({ mode, error: null });
        // Save to AsyncStorage
        AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(error => {
          logger.error('Error saving theme preference:', error);
          set({ error: 'Failed to save theme preference' });
        });
      },

      toggleTheme: () => {
        const { mode } = get();
        const newMode = mode === 'light' ? 'dark' : 'light';
        get().setTheme(newMode);
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearError: () => {
        set({ error: null });
      },

      getTheme: () => {
        const { mode } = get();
        return themes[mode];
      },
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the mode, not loading/error states
      partialize: state => ({ mode: state.mode }),
    }
  )
);

// Initialize theme from system preference
export const initializeThemeStore = async () => {
  const store = useThemeStore.getState();

  try {
    store.setLoading(true);

    // Try to load saved theme preference
    const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      store.setTheme(savedTheme);
    }
    // If no saved preference, the default 'light' will be used
    // System theme detection should be handled in the component that uses the store
  } catch (error) {
    logger.error('Error loading theme preference:', error);
    store.setTheme('light'); // Fallback to light theme
  } finally {
    store.setLoading(false);
  }
};
