import DatabaseManager, { DatabaseState } from '../database/DatabaseManager';
import { backgroundSyncService } from '../sync/BackgroundSyncService';
import { localDataService } from '../database/LocalDataService';
import { initializeCombinedLanguageSelectionStore } from '../../../features/languages/store';
import { logger } from '@/shared/utils/logger';

interface InitializationStep {
  name: string;
  execute: () => Promise<void>;
  required: boolean;
  timeout?: number;
}

interface InitializationProgress {
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  isComplete: boolean;
  error?: string;
}

export class InitializationService {
  private static instance: InitializationService;
  private isInitialized = false;
  private isInitializing = false;
  private initializationPromise: Promise<void> | null = null;
  private initializationError: Error | null = null;
  private progress: InitializationProgress = {
    currentStep: '',
    completedSteps: [],
    totalSteps: 0,
    isComplete: false,
  };

  private constructor() {}

  static getInstance(): InitializationService {
    if (!InitializationService.instance) {
      InitializationService.instance = new InitializationService();
    }
    return InitializationService.instance;
  }

  /**
   * Initialize all app services in proper order
   */
  async initialize(): Promise<void> {
    // Return existing promise if initialization is in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized) {
      return;
    }

    // Throw previous error if initialization failed
    if (this.initializationError) {
      throw this.initializationError;
    }

    // Create and cache the initialization promise
    this.initializationPromise = this.performInitialization();

    try {
      await this.initializationPromise;
    } catch (error) {
      // Reset promise so retry is possible
      this.initializationPromise = null;
      throw error;
    }
  }

  private async performInitialization(): Promise<void> {
    this.isInitializing = true;
    this.initializationError = null;

    const steps: InitializationStep[] = [
      {
        name: 'Database',
        execute: () => DatabaseManager.getInstance().initialize(),
        required: true,
        timeout: 10000,
      },
      {
        name: 'Language Selection Store',
        execute: () => initializeCombinedLanguageSelectionStore(),
        required: false,
        timeout: 15000, // Increased timeout for language sync operations
      },
      {
        name: 'Background Sync',
        execute: () => backgroundSyncService.initialize(),
        required: false,
        timeout: 5000,
      },
      {
        name: 'Local Data Service',
        execute: async () => {
          // Verify database is accessible
          await localDataService.getBooks();
        },
        required: false,
        timeout: 3000,
      },
    ];

    this.progress = {
      currentStep: '',
      completedSteps: [],
      totalSteps: steps.length,
      isComplete: false,
    };

    try {
      for (const step of steps) {
        this.progress.currentStep = step.name;
        logger.info(`Initializing ${step.name}...`);

        try {
          if (step.timeout) {
            await this.executeWithTimeout(
              step.execute,
              step.timeout,
              step.name
            );
          } else {
            await step.execute();
          }

          this.progress.completedSteps.push(step.name);
          logger.info(`✅ ${step.name} initialized successfully`);
        } catch (error) {
          logger.error(`❌ ${step.name} initialization failed:`, error);

          if (step.required) {
            throw new Error(
              `Required service ${step.name} failed to initialize: ${error}`
            );
          } else {
            logger.warn(
              `⚠️ Optional service ${step.name} failed, continuing...`
            );
            // Add to completed with warning
            this.progress.completedSteps.push(`${step.name} (failed)`);
          }
        }
      }

      this.progress.isComplete = true;
      this.progress.currentStep = 'Complete';
      this.isInitialized = true;
      this.isInitializing = false;

      logger.info('🎉 App initialization completed successfully');
    } catch (error) {
      this.isInitializing = false;
      this.initializationError =
        error instanceof Error ? error : new Error(String(error));
      this.progress.error = this.initializationError.message;

      logger.error('💥 App initialization failed:', error);
      throw this.initializationError;
    }
  }

  private async executeWithTimeout(
    fn: () => Promise<void>,
    timeoutMs: number,
    stepName: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(`${stepName} initialization timed out after ${timeoutMs}ms`)
        );
      }, timeoutMs);

      fn()
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Get current initialization progress
   */
  getProgress(): InitializationProgress {
    return { ...this.progress };
  }

  /**
   * Check if initialization is complete
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if initialization is in progress
   */
  isLoading(): boolean {
    return this.isInitializing;
  }

  /**
   * Get initialization error if any
   */
  getError(): Error | null {
    return this.initializationError;
  }

  /**
   * Reset initialization state (for retry)
   */
  reset(): void {
    this.isInitialized = false;
    this.isInitializing = false;
    this.initializationPromise = null;
    this.initializationError = null;
    this.progress = {
      currentStep: '',
      completedSteps: [],
      totalSteps: 0,
      isComplete: false,
    };
  }

  /**
   * Wait for initialization to complete, with timeout
   */
  async waitForReady(timeoutMs: number = 15000): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const startTime = Date.now();

    while (!this.isInitialized && Date.now() - startTime < timeoutMs) {
      if (this.initializationError) {
        throw this.initializationError;
      }

      if (!this.isInitializing && !this.initializationPromise) {
        // Start initialization if not already started
        await this.initialize();
        return;
      }

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.isInitialized) {
      throw new Error(`App initialization timeout after ${timeoutMs}ms`);
    }
  }

  /**
   * Get database state for debugging
   */
  getDatabaseState(): DatabaseState {
    return DatabaseManager.getInstance().currentState;
  }
}

// Export singleton instance
export const initializationService = InitializationService.getInstance();
export default initializationService;
