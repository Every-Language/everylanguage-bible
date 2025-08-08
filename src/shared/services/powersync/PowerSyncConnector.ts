import { UpdateType, AbstractPowerSyncDatabase } from '@powersync/react-native';
import { supabase } from '@/shared/services/api/supabase';
import { env } from '@/app/config/env';
import { logger } from '@/shared/utils/logger';
import type {
  PowerSyncBackendConnector,
  SupabaseAuthResponse,
  PowerSyncCredentials,
} from './types';

/**
 * PowerSync Backend Connector
 *
 * Handles authentication with PowerSync and uploading local changes to the backend.
 * Supports both authenticated and unauthenticated users for public Bible data access.
 */
export class PowerSyncConnector implements PowerSyncBackendConnector {
  /**
   * Get credentials for connecting to PowerSync
   * Called every few minutes to refresh the connection
   *
   * @returns PowerSync credentials with authentication parameters
   */
  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    try {
      logger.info('PowerSync: Fetching credentials...');

      // Validate PowerSync URL first
      if (!env.powersync.url) {
        throw new Error(
          'PowerSync URL not configured. Please set EXPO_PUBLIC_POWERSYNC_DEV_URL in your environment.'
        );
      }

      // Try to get existing session first
      const {
        data: { session },
        error: sessionError,
      }: SupabaseAuthResponse = await supabase.auth.getSession();

      if (sessionError) {
        logger.error(
          'PowerSync: Failed to get Supabase session:',
          sessionError
        );
        throw sessionError;
      }

      let accessToken: string;

      if (session?.access_token) {
        // User is authenticated - use their token
        logger.info('PowerSync: Using authenticated user session');
        accessToken = session.access_token;
      } else {
        // User is not authenticated - create anonymous session for public data access
        logger.info(
          'PowerSync: No authenticated session, creating anonymous session...'
        );
        accessToken = await this.getOrCreateAnonymousSession();
      }

      // Determine if user is authenticated
      const isAuthenticated = session?.user?.aud === 'authenticated';
      // && session?.user?.is_anonymous !== true;

      const credentials: PowerSyncCredentials = {
        endpoint: env.powersync.url,
        token: accessToken,
        // Pass authentication status to sync rules as required by sync-rules.yaml
        parameters: {
          is_authenticated: isAuthenticated ? 'true' : 'false',
        },
      };

      logger.info('PowerSync: Credentials fetched successfully', {
        isAuthenticated,
        userId: session?.user?.id,
      });
      return credentials;
    } catch (error) {
      logger.error('PowerSync: Failed to fetch credentials:', error);
      throw error;
    }
  }

  /**
   * Get or create an anonymous session for unauthenticated users
   * This allows access to public Bible data without requiring user registration
   */
  private async getOrCreateAnonymousSession(): Promise<string> {
    try {
      // Try to sign in anonymously
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        logger.error('PowerSync: Failed to create anonymous session:', error);
        throw new Error(`Failed to create anonymous session: ${error.message}`);
      }

      if (!data.session?.access_token) {
        throw new Error(
          'Anonymous session created but no access token received'
        );
      }

      logger.info('PowerSync: Anonymous session created successfully');
      return data.session.access_token;
    } catch (error) {
      logger.error('PowerSync: Error in anonymous session creation:', error);
      throw error;
    }
  }

  /**
   * Upload local changes to the backend
   * Called when there are pending local changes to sync
   */
  async uploadData(database: AbstractPowerSyncDatabase) {
    try {
      // Get the next batch of CRUD operations to upload
      const transaction = await database.getNextCrudTransaction();

      if (!transaction) {
        return;
      }

      logger.info(
        `PowerSync: Uploading ${transaction.crud.length} operations...`
      );

      for (const op of transaction.crud) {
        const table = op.table;
        const record = { ...op.opData, id: op.id };

        logger.debug(`PowerSync: Processing ${op.op} on ${table}:`, {
          id: op.id,
        });

        try {
          switch (op.op) {
            case UpdateType.PUT:
              await this.upsertRecord(table, record);
              break;

            case UpdateType.PATCH:
              await this.updateRecord(table, record);
              break;

            case UpdateType.DELETE:
              await this.deleteRecord(table, op.id);
              break;

            default:
              logger.warn(`PowerSync: Unknown operation type: ${op.op}`);
          }
        } catch (operationError) {
          logger.error(
            `PowerSync: Failed to process ${op.op} on ${table}:`,
            operationError
          );
          throw operationError;
        }
      }

      // Mark transaction as complete
      await transaction.complete();
      logger.info('PowerSync: Transaction completed successfully');
    } catch (error) {
      logger.error('PowerSync: Failed to upload data:', error);
      throw error;
    }
  }

  private async upsertRecord(
    table: string,
    record: Record<string, unknown>
  ): Promise<void> {
    // Using 'any' here is necessary because Supabase's typed client doesn't support
    // dynamic table names, but PowerSync needs to work with any table defined in sync rules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from(table)
      .upsert(record, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    logger.debug(`PowerSync: Upserted record in ${table}:`, {
      id: record['id'],
    });
  }

  private async updateRecord(
    table: string,
    record: Record<string, unknown>
  ): Promise<void> {
    const { id, ...updateData } = record;

    // Using 'any' here is necessary because Supabase's typed client doesn't support dynamic table names, but PowerSync needs to work with any table defined in sync rules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from(table)
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw error;
    }

    logger.debug(`PowerSync: Updated record in ${table}:`, { id });
  }

  private async deleteRecord(table: string, id: string): Promise<void> {
    // Using 'any' here is necessary because Supabase's typed client doesn't support dynamic table names, but PowerSync needs to work with any table defined in sync rules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from(table).delete().eq('id', id);

    if (error) {
      throw error;
    }

    logger.debug(`PowerSync: Deleted record from ${table}:`, { id });
  }
}
