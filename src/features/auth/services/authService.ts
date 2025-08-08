import { supabase } from '@/shared/services/api/supabase';
import { powerSyncConnectionManager } from '@/shared/services/powersync/PowerSyncConnectionManager';
import { dataMigrationService } from '@/shared/services/powersync/DataMigrationService';
import { logger } from '@/shared/utils/logger';
import type { AuthCredentials } from '@/shared/types/auth';

export interface AuthResult {
  success: boolean;
  user?: any;
  session?: any;
  migrationResult?: any;
  error?: string;
}

export interface SignInOptions {
  shouldMigrateData?: boolean;
  conflictResolution?: 'keep_anonymous' | 'keep_authenticated' | 'merge';
}

export const authService = {
  /**
   * Sign in with email and password
   * Handles data migration from anonymous to authenticated user
   */
  async signIn(
    credentials: AuthCredentials,
    options: SignInOptions = {
      shouldMigrateData: true,
      conflictResolution: 'merge',
    }
  ): Promise<AuthResult> {
    try {
      logger.info('AuthService: Starting sign in process');

      // Check if user has anonymous data before signing in
      const hasAnonData = await dataMigrationService.hasAnonymousData();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No user returned from sign in' };
      }

      logger.info(
        'AuthService: Sign in successful, processing authentication transition...'
      );

      // Handle data migration if user had anonymous data and wants to merge
      let migrationResult;
      if (hasAnonData && options.shouldMigrateData && data.user.id) {
        logger.info(
          'AuthService: Migrating anonymous data to authenticated user'
        );

        migrationResult = await dataMigrationService.migrateAnonymousDataToUser(
          data.user.id,
          {
            shouldMergeData: options.shouldMigrateData,
            conflictResolution: options.conflictResolution || 'merge',
          }
        );

        if (migrationResult.success) {
          logger.info('AuthService: Data migration completed successfully', {
            migratedTables: migrationResult.migratedTables,
            affectedRecords: migrationResult.affectedRecords,
          });
        } else {
          logger.warn(
            'AuthService: Data migration failed:',
            migrationResult.error
          );
        }
      }

      // Notify PowerSync connection manager about authentication
      await powerSyncConnectionManager.onUserAuthenticated();

      return {
        success: true,
        user: data.user,
        session: data.session,
        migrationResult,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('AuthService: Sign in failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Sign up with email and password
   * Handles data migration from anonymous to new authenticated user
   */
  async signUp(
    credentials: AuthCredentials,
    options: SignInOptions = {
      shouldMigrateData: true,
      conflictResolution: 'merge',
    }
  ): Promise<AuthResult> {
    try {
      logger.info('AuthService: Starting sign up process');

      // Check if user has anonymous data before signing up
      const hasAnonData = await dataMigrationService.hasAnonymousData();

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No user returned from sign up' };
      }

      logger.info(
        'AuthService: Sign up successful, processing authentication transition...'
      );

      // Handle data migration if user had anonymous data and wants to merge
      let migrationResult;
      if (hasAnonData && options.shouldMigrateData && data.user.id) {
        logger.info(
          'AuthService: Migrating anonymous data to new authenticated user'
        );

        migrationResult = await dataMigrationService.migrateAnonymousDataToUser(
          data.user.id,
          {
            shouldMergeData: options.shouldMigrateData,
            conflictResolution: options.conflictResolution || 'merge',
          }
        );

        if (migrationResult.success) {
          logger.info('AuthService: Data migration completed successfully', {
            migratedTables: migrationResult.migratedTables,
            affectedRecords: migrationResult.affectedRecords,
          });
        } else {
          logger.warn(
            'AuthService: Data migration failed:',
            migrationResult.error
          );
        }
      }

      // Notify PowerSync connection manager about authentication
      await powerSyncConnectionManager.onUserAuthenticated();

      return {
        success: true,
        user: data.user,
        session: data.session,
        migrationResult,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('AuthService: Sign up failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Sign out user and switch to anonymous session
   */
  async signOut(): Promise<AuthResult> {
    try {
      logger.info('AuthService: Starting sign out process');

      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      // Notify PowerSync connection manager about sign out
      // This will automatically create a new anonymous session
      await powerSyncConnectionManager.onUserSignedOut();

      logger.info(
        'AuthService: Sign out completed, switched to anonymous session'
      );

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('AuthService: Sign out failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Promote anonymous user to authenticated user (convert existing account)
   */
  async promoteAnonymousUser(
    credentials: AuthCredentials
  ): Promise<AuthResult> {
    try {
      logger.info(
        'AuthService: Promoting anonymous user to authenticated user'
      );

      // Update the current anonymous user with email and password
      const { data, error } = await supabase.auth.updateUser({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No user returned from promotion' };
      }

      logger.info('AuthService: Anonymous user promotion successful');

      // Refresh PowerSync connection with authenticated session
      await powerSyncConnectionManager.onUserAuthenticated();

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'AuthService: Anonymous user promotion failed:',
        errorMessage
      );
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Reset password for email
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'your-app://reset-password',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('AuthService: Password reset failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return user;
  },

  /**
   * Get current session
   */
  async getCurrentSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return session;
  },

  /**
   * Check if current session is anonymous
   */
  async isAnonymousSession(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      return session?.user?.is_anonymous ?? false;
    } catch {
      return false;
    }
  },

  /**
   * Check if user has anonymous data that can be migrated
   */
  async hasAnonymousData(): Promise<boolean> {
    return dataMigrationService.hasAnonymousData();
  },

  /**
   * Force create anonymous session (useful for offline init)
   */
  async ensureAnonymousSession(): Promise<AuthResult> {
    try {
      const session = await this.getCurrentSession();

      if (session) {
        logger.debug('AuthService: Session already exists');
        return { success: true, user: session.user, session };
      }

      logger.info('AuthService: Creating anonymous session for offline use');

      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'AuthService: Failed to ensure anonymous session:',
        errorMessage
      );
      return { success: false, error: errorMessage };
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
