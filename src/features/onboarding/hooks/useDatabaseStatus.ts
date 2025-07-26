import { useState, useEffect } from 'react';
import DatabaseManager, {
  DatabaseInitProgress,
} from '@/shared/services/database/DatabaseManager';
import { logger } from '@/shared/utils/logger';

export const useDatabaseStatus = () => {
  const [databaseStatus, setDatabaseStatus] = useState<
    'checking' | 'ready' | 'error' | 'initializing'
  >('checking');
  const [databaseProgress, setDatabaseProgress] =
    useState<DatabaseInitProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkDatabaseStatus = async () => {
    try {
      logger.info('OnboardingMainScreen: Starting database status check');
      setDatabaseStatus('checking');
      setError(null);

      const databaseManager = DatabaseManager.getInstance();

      // Check if database is already initialized
      if (databaseManager.isReady()) {
        logger.info('OnboardingMainScreen: Database is already ready');
        setDatabaseStatus('ready');
        return;
      }

      // Check if database is currently being initialized (by SyncContext)
      if (databaseManager.initialized) {
        logger.info('OnboardingMainScreen: Database is being initialized');
        setDatabaseStatus('initializing');
        return;
      }

      // Try to initialize database
      logger.info('OnboardingMainScreen: Attempting to initialize database');
      setDatabaseStatus('initializing');

      const progressHandler = (progress: DatabaseInitProgress) => {
        logger.info('OnboardingMainScreen: Database progress:', progress);
        setDatabaseProgress(progress);
      };

      databaseManager.setProgressCallback(progressHandler);
      const initPromise = databaseManager.initialize();

      await initPromise;

      logger.info('OnboardingMainScreen: Database initialization completed');
      setDatabaseStatus('ready');
      setDatabaseProgress(null);
    } catch (error) {
      logger.error(
        'OnboardingMainScreen: Database initialization failed:',
        error
      );
      setDatabaseStatus('error');
      setError(error instanceof Error ? error.message : 'Unknown error');
      setDatabaseProgress(null);
    }
  };

  const verifyDatabase = async () => {
    try {
      logger.info('OnboardingMainScreen: Verifying database');
      const databaseManager = DatabaseManager.getInstance();

      if (databaseManager.isReady()) {
        logger.info('OnboardingMainScreen: Database verification successful');
        setDatabaseStatus('ready');
        setError(null);
      } else {
        logger.info('OnboardingMainScreen: Database verification failed');
        setDatabaseStatus('error');
        setError('Database is not properly initialized');
      }
    } catch (error) {
      logger.error('OnboardingMainScreen: Database verification error:', error);
      setDatabaseStatus('error');
      setError(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  const handleRetryDatabase = () => {
    checkDatabaseStatus();
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  return {
    databaseStatus,
    databaseProgress,
    error,
    checkDatabaseStatus,
    verifyDatabase,
    handleRetryDatabase,
  };
};
