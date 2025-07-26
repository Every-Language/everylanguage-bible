import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { authService } from '../services/authService';
import { logger } from '../../../shared/utils/logger';
import type { AuthState } from '@/shared/types/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isInitialized: false,
  });

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = await authService.getCurrentSession();
        setAuthState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isInitialized: true,
        });
      } catch (error) {
        logger.error('Failed to initialize auth:', error);
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isInitialized: true,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await authService.signIn({ email, password });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sign in failed';
      Alert.alert('Sign In Error', errorMessage);
      throw error;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const data = await authService.signUp({ email, password });

      if (!data.session) {
        Alert.alert(
          'Success',
          'Please check your email to verify your account!'
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sign up failed';
      Alert.alert('Sign Up Error', errorMessage);
      throw error;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await authService.signOut();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sign out failed';
      Alert.alert('Sign Out Error', errorMessage);
      throw error;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await authService.resetPassword(email);
      Alert.alert('Success', 'Password reset email sent!');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Password reset failed';
      Alert.alert('Reset Password Error', errorMessage);
      throw error;
    }
  }, []);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
