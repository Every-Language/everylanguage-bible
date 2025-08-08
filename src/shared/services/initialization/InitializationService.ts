import { backgroundSyncService } from '../sync/BackgroundSyncService';
import DatabaseManager, { DatabaseState } from '../database/DatabaseManager';
import { LocalDataService } from '../database/LocalDataService';
import { powerSyncSystem } from '../powersync/PowerSyncSystem';
import { powerSyncConnectionManager } from '../powersync/PowerSyncConnectionManager';
import { logger } from '../../utils/logger';

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
   * Initialize all app services in proper order following PowerSync best practices
   * Separates offline-capable services from network-dependent ones
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

    // Define initialization steps following PowerSync best practices
    const steps: InitializationStep[] = [
      {
        name: 'Database Manager',
        execute: () => DatabaseManager.getInstance().initialize(),
        required: true,
        timeout: 10000,
      },
      {
        name: 'PowerSync Database',
        execute: () => powerSyncSystem.initialize(),
        required: true,
        timeout: 8000,
      },
      {
        name: 'PowerSync Connection Manager',
        execute: () => powerSyncConnectionManager.initialize(),
        required: false, // Optional - app works offline without this
        timeout: 5000,
      },
      {
        name: 'Background Sync',
        execute: () => backgroundSyncService.initialize(),
        required: false, // Optional - for background processing
        timeout: 5000,
      },
      {
        name: 'Local Data Service',
        execute: async () => {
          // Verify database is accessible
          await LocalDataService.getInstance().getBooks();
        },
        required: false, // Optional - just a verification step
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

      // Log initialization summary
      this.logInitializationSummary();
    } catch (error) {
      this.isInitializing = false;
      this.initializationError =
        error instanceof Error ? error : new Error(String(error));
      this.progress.error = this.initializationError.message;

      logger.error('💥 App initialization failed:', error);
      throw this.initializationError;
    }
  }

  /**
   * Log a summary of initialization results
   */
  private logInitializationSummary(): void {
    const completed = this.progress.completedSteps.filter(
      step => !step.includes('(failed)')
    );
    const failed = this.progress.completedSteps.filter(step =>
      step.includes('(failed)')
    );

    logger.info('📋 Initialization Summary:', {
      total: this.progress.totalSteps,
      completed: completed.length,
      failed: failed.length,
      services: {
        successful: completed,
        failed: failed.map(step => step.replace(' (failed)', '')),
      },
    });

    // Log offline capabilities
    const hasPowerSyncDb = completed.some(step =>
      step.includes('PowerSync Database')
    );
    const hasPowerSyncConnection = completed.some(step =>
      step.includes('PowerSync Connection Manager')
    );

    logger.info('🔄 App Capabilities:', {
      canWorkOffline: hasPowerSyncDb,
      canSync: hasPowerSyncConnection,
      mode: hasPowerSyncConnection ? 'Online + Offline' : 'Offline Only',
    });
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

  /**
   * Get PowerSync connection state for debugging
   */
  getPowerSyncState() {
    try {
      return {
        database: {
          isInitialized: powerSyncSystem.isInitialized,
          isConnected: powerSyncSystem.isConnected,
          status: powerSyncSystem.getStatus(),
        },
        connectionManager: powerSyncConnectionManager.getState(),
      };
    } catch {
      return {
        database: { error: 'Failed to get PowerSync database state' },
        connectionManager: { error: 'Failed to get connection manager state' },
      };
    }
  }

  /**
   * Check if the app can work offline (core functionality available)
   */
  canWorkOffline(): boolean {
    const dbReady = DatabaseManager.getInstance().isReady();
    const powerSyncDbReady = powerSyncSystem.isInitialized;
    return dbReady && powerSyncDbReady;
  }

  /**
   * Check if the app can sync (network functionality available)
   */
  canSync(): boolean {
    const connectionState = powerSyncConnectionManager.getState();
    return connectionState.isInitialized && connectionState.isConnected;
  }
}

// Export singleton instance
export const initializationService = InitializationService.getInstance();
export default initializationService;
