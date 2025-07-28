import { bibleSync } from '@/shared/services/sync/bible/BibleSyncService';
import { languageSync } from '@/shared/services/sync/language/LanguageSyncService';
import { localDataService } from '@/shared/services/database/LocalDataService';
import { logger } from '@/shared/utils/logger';

export interface OnboardingSyncProgress {
  stage:
    | 'checking'
    | 'syncing_bible'
    | 'syncing_languages'
    | 'verifying'
    | 'complete';
  message: string;
  progress: number; // 0-100
  currentTable?: string;
  recordsSynced?: number;
  totalRecords?: number;
}

export interface OnboardingSyncResult {
  success: boolean;
  totalRecordsSynced: number;
  errors: string[];
  duration: number;
}

type ProgressCallback = (progress: OnboardingSyncProgress) => void;

class OnboardingSyncService {
  private static instance: OnboardingSyncService;
  private isSyncing = false;
  private progressCallback: ProgressCallback | null = null;

  private constructor() {}

  static getInstance(): OnboardingSyncService {
    if (!OnboardingSyncService.instance) {
      OnboardingSyncService.instance = new OnboardingSyncService();
    }
    return OnboardingSyncService.instance;
  }

  setProgressCallback(callback: ProgressCallback | null): void {
    this.progressCallback = callback;
  }

  private updateProgress(progress: OnboardingSyncProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Optimized sync for onboarding with larger batch sizes and better progress tracking
   */
  async performOnboardingSync(): Promise<OnboardingSyncResult> {
    if (this.isSyncing) {
      throw new Error('Onboarding sync is already in progress');
    }

    this.isSyncing = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let totalRecordsSynced = 0;

    try {
      // Step 1: Check current data availability
      this.updateProgress({
        stage: 'checking',
        message: 'Checking current data...',
        progress: 5,
      });

      const hasData = await localDataService.isDataAvailable();

      // Step 2: Sync Bible content with optimized settings
      this.updateProgress({
        stage: 'syncing_bible',
        message: 'Syncing Bible content...',
        progress: 10,
      });

      try {
        const bibleResults = await bibleSync.syncAll({
          forceFullSync: !hasData,
          batchSize: 3000, // Larger batch size for faster onboarding
        });

        // Process Bible sync results
        for (const result of bibleResults) {
          totalRecordsSynced += result.recordsSynced;
          if (!result.success && result.error) {
            errors.push(
              `Bible sync error (${result.tableName}): ${result.error}`
            );
          }
        }
      } catch (bibleError) {
        const errorMessage =
          bibleError instanceof Error
            ? bibleError.message
            : 'Unknown Bible sync error';
        errors.push(`Bible sync failed: ${errorMessage}`);
        logger.error('Bible sync failed during onboarding:', {
          error: bibleError,
          errorType: typeof bibleError,
          errorConstructor: (bibleError as any)?.constructor?.name,
          errorMessage: (bibleError as any)?.message || 'No message',
          errorStack: (bibleError as any)?.stack || 'No stack',
        });
      }

      // Step 3: Sync Language content
      this.updateProgress({
        stage: 'syncing_languages',
        message: 'Syncing language data...',
        progress: 70,
      });

      try {
        const languageResults = await languageSync.syncAll({
          forceFullSync: !hasData,
          batchSize: 2000, // Larger batch size for faster onboarding
        });

        // Process Language sync results
        for (const result of languageResults) {
          totalRecordsSynced += result.recordsSynced;
          if (!result.success && result.error) {
            errors.push(
              `Language sync error (${result.tableName}): ${result.error}`
            );
          }
        }
      } catch (languageError) {
        const errorMessage =
          languageError instanceof Error
            ? languageError.message
            : 'Unknown language sync error';
        errors.push(`Language sync failed: ${errorMessage}`);
        logger.error('Language sync failed during onboarding:', {
          error: languageError,
          errorType: typeof languageError,
          errorConstructor: (languageError as any)?.constructor?.name,
          errorMessage: (languageError as any)?.message || 'No message',
          errorStack: (languageError as any)?.stack || 'No stack',
        });
      }

      // Step 4: Verify data integrity
      this.updateProgress({
        stage: 'verifying',
        message: 'Verifying data integrity...',
        progress: 90,
      });

      try {
        const verificationResult = await this.verifyDataIntegrity();
        if (!verificationResult.success) {
          errors.push(
            `Data verification failed: ${verificationResult.missingTables.join(', ')}`
          );
        }
      } catch (verificationError) {
        const errorMessage =
          verificationError instanceof Error
            ? verificationError.message
            : 'Unknown verification error';
        errors.push(`Data verification failed: ${errorMessage}`);
        logger.error('Data verification failed during onboarding:', {
          error: verificationError,
          errorType: typeof verificationError,
          errorConstructor: (verificationError as any)?.constructor?.name,
          errorMessage: (verificationError as any)?.message || 'No message',
          errorStack: (verificationError as any)?.stack || 'No stack',
        });
      }

      // Step 5: Complete
      this.updateProgress({
        stage: 'complete',
        message: 'Onboarding sync completed successfully!',
        progress: 100,
        recordsSynced: totalRecordsSynced,
      });

      const duration = Date.now() - startTime;
      logger.info(
        `Onboarding sync completed in ${duration}ms, synced ${totalRecordsSynced} records`
      );

      return {
        success: errors.length === 0,
        totalRecordsSynced,
        errors,
        duration,
      };
    } catch (error) {
      // Enhanced error logging with detailed information
      const errorDetails = {
        error: error,
        errorType: typeof error,
        errorConstructor: (error as any)?.constructor?.name,
        errorMessage: (error as any)?.message || 'No message',
        errorStack: (error as any)?.stack || 'No stack',
        errorStringified: JSON.stringify(
          error,
          Object.getOwnPropertyNames(error || {})
        ),
      };

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Onboarding sync failed: ${errorMessage}`);
      logger.error('Onboarding sync failed:', errorDetails);

      return {
        success: false,
        totalRecordsSynced,
        errors,
        duration: Date.now() - startTime,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Verify that all required tables have data
   */
  private async verifyDataIntegrity(): Promise<{
    success: boolean;
    missingTables: string[];
  }> {
    const requiredTables = [
      { name: 'books', checkFn: () => localDataService.getBooksCount() },
      { name: 'chapters', checkFn: () => localDataService.getChaptersCount() },
      { name: 'verses', checkFn: () => localDataService.getVersesCount() },
    ];

    const missingTables: string[] = [];

    for (const table of requiredTables) {
      try {
        const count = await table.checkFn();
        if (count === 0) {
          missingTables.push(table.name);
        }
      } catch (error) {
        logger.warn(`Failed to verify table ${table.name}:`, error);
        missingTables.push(table.name);
      }
    }

    return {
      success: missingTables.length === 0,
      missingTables,
    };
  }

  /**
   * Check if onboarding sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Cancel ongoing sync (if possible)
   */
  cancelSync(): void {
    // Note: This is a basic implementation. For full cancellation,
    // we'd need to implement cancellation tokens in the sync services
    this.isSyncing = false;
    logger.info('Onboarding sync cancellation requested');
  }
}

export const onboardingSyncService = OnboardingSyncService.getInstance();
