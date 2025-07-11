import { supabase } from './supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export class AuthService {
  /**
   * Initialize anonymous authentication for offline-first experience
   */
  static async initializeAnonymousAuth(): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.warn('Auth initialization error:', error.message);
        return null;
      }

      // If no user exists, create anonymous user
      if (!user) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: `anonymous_${Date.now()}@everylanguage.local`,
          password: `temp_${Math.random().toString(36).substring(7)}`,
        });

        if (signUpError) {
          console.warn('Anonymous auth creation failed:', signUpError.message);
          return null;
        }

        return data.user;
      }

      return user;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      return null;
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    return { user: data.user, error };
  }

  /**
   * Sign in with email and password
   */
  static async signIn(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { user: data.user, error };
  }

  /**
   * Sign in with phone number (SMS)
   */
  static async signInWithPhone(
    phone: string
  ): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    return { error };
  }

  /**
   * Verify phone OTP
   */
  static async verifyPhoneOTP(
    phone: string,
    token: string
  ): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    return { user: data.user, error };
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<Session | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Reset password
   */
  static async resetPassword(
    email: string
  ): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }

  /**
   * Update user password
   */
  static async updatePassword(
    password: string
  ): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    return { error };
  }
}
