import { useState, useEffect, useCallback } from 'react';
import { powerSyncSystem } from '@/shared/services/powersync';
import { logger } from '@/shared/utils/logger';

export interface PowerSyncStatus {
  initialized: boolean;
  connected: boolean;
  syncing: boolean;
  error: string | null;
}

export const usePowerSync = () => {
  const [status, setStatus] = useState<PowerSyncStatus>({
    initialized: false,
    connected: false,
    syncing: false,
    error: null,
  });

  const [isInitializing, setIsInitializing] = useState(false);

  // Check current status and update if already initialized
  const checkCurrentStatus = useCallback(() => {
    try {
      const currentStatus = powerSyncSystem.getStatus();
      logger.info('usePowerSync: Checking current status:', currentStatus);

      setStatus(prev => ({
        ...prev,
        initialized: currentStatus.initialized,
        connected: currentStatus.connected,
        error: null,
      }));

      return currentStatus;
    } catch (error) {
      logger.error('usePowerSync: Failed to get current status:', error);
      return null;
    }
  }, []);

  // Initialize PowerSync (only if not already initialized)
  const initialize = useCallback(async () => {
    // First check if already initialized
    const currentStatus = checkCurrentStatus();
    if (currentStatus?.initialized) {
      logger.info('usePowerSync: PowerSync already initialized');
      return;
    }

    if (isInitializing) {
      logger.info('usePowerSync: Already initializing...');
      return;
    }

    setIsInitializing(true);

    try {
      logger.info('usePowerSync: Initializing PowerSync...');

      // Initialize the database
      await powerSyncSystem.initialize();

      // Connect to backend
      await powerSyncSystem.connect();

      // Update status after successful initialization
      checkCurrentStatus();

      logger.info('usePowerSync: PowerSync initialized successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('usePowerSync: Failed to initialize PowerSync:', error);

      setStatus(prev => ({
        ...prev,
        initialized: false,
        connected: false,
        error: errorMessage,
      }));
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, checkCurrentStatus]);

  // Disconnect from PowerSync
  const disconnect = useCallback(async () => {
    try {
      await powerSyncSystem.disconnect();
      setStatus(prev => ({
        ...prev,
        connected: false,
        syncing: false,
      }));
    } catch (error) {
      logger.error('usePowerSync: Failed to disconnect:', error);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setStatus(prev => ({ ...prev, error: null }));
  }, []);

  // Check status on mount and set up periodic updates
  useEffect(() => {
    // Check status immediately on mount
    checkCurrentStatus();

    // Set up periodic status updates
    const interval = setInterval(() => {
      checkCurrentStatus();
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [checkCurrentStatus]);

  return {
    // Status
    status,
    isInitializing,

    // Actions
    initialize,
    disconnect,
    clearError,

    // Database access
    database: status.initialized ? powerSyncSystem : null,

    // Convenience methods
    execute: status.initialized
      ? powerSyncSystem.execute.bind(powerSyncSystem)
      : null,
    getAll: status.initialized
      ? powerSyncSystem.getAll.bind(powerSyncSystem)
      : null,
    get: status.initialized ? powerSyncSystem.get.bind(powerSyncSystem) : null,
    watch: status.initialized
      ? powerSyncSystem.watch.bind(powerSyncSystem)
      : null,
  };
};
