import { useAuthStore } from '../store/authStore';
import type { AuthContextValue } from '../types/auth';

/**
 * Hook that provides the same API as the old AuthProvider
 * but uses the new Zustand store instead of React Context
 */
export const useAuthContext = (): AuthContextValue => {
  const {
    user,
    session,
    isLoading,
    isInitialized,
    signIn,
    signOut,
    signUp,
    resetPassword,
  } = useAuthStore();

  return {
    user,
    session,
    isLoading,
    isInitialized,
    signIn,
    signOut,
    signUp,
    resetPassword,
  };
};
