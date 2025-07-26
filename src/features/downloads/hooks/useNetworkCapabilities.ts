import { useState, useEffect, useCallback } from 'react';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { NetworkService } from '@/shared/services/network';
import { logger } from '@/shared/utils/logger';

interface NetworkCapabilitiesState {
  isCheckingOnline: boolean;
  isOnline: boolean;
  hasCheckedOnline: boolean;
  searchError: string | null;
}

export const useNetworkCapabilities = () => {
  const { isConnected, connectionType, isInternetReachable } =
    useNetworkConnectivity();

  const [state, setState] = useState<NetworkCapabilitiesState>({
    isCheckingOnline: false,
    isOnline: false,
    hasCheckedOnline: false,
    searchError: null,
  });

  const checkOnlineCapabilities = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isCheckingOnline: true,
      searchError: null,
    }));

    logger.info('Starting online capabilities check...');

    try {
      const isOnlineCapable = await NetworkService.checkOnlineCapabilities();
      logger.info('Online capabilities check result:', isOnlineCapable);

      if (isOnlineCapable) {
        setState(prev => ({
          ...prev,
          isOnline: true,
          isCheckingOnline: false,
          hasCheckedOnline: true,
        }));
        logger.info('Set isOnline to true');
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isOnline: false,
          isCheckingOnline: false,
          hasCheckedOnline: true,
          searchError: 'Unable to reach online services',
        }));
        logger.info('Set isOnline to false - unable to reach online services');
        return false;
      }
    } catch (error) {
      logger.error('Online capabilities check failed:', error);
      setState(prev => ({
        ...prev,
        isOnline: false,
        isCheckingOnline: false,
        hasCheckedOnline: true,
        searchError: 'No internet connection available',
      }));
      return false;
    }
  }, []);

  const retryInternetCheck = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isCheckingOnline: true,
      searchError: null,
    }));

    try {
      const isOnlineCapable = await NetworkService.checkOnlineCapabilities();

      if (isOnlineCapable) {
        setState(prev => ({
          ...prev,
          isOnline: true,
          isCheckingOnline: false,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isOnline: false,
          isCheckingOnline: false,
          searchError: 'Still unable to reach online services',
        }));
        return false;
      }
    } catch {
      setState(prev => ({
        ...prev,
        isOnline: false,
        isCheckingOnline: false,
        searchError: 'Internet check failed',
      }));
      return false;
    }
  }, []);

  // Monitor network connectivity changes and recheck when internet resumes
  useEffect(() => {
    if (
      isConnected &&
      isInternetReachable &&
      !state.isOnline &&
      state.hasCheckedOnline
    ) {
      logger.info('Internet connection resumed, rechecking capabilities...');
      checkOnlineCapabilities();
    }
  }, [
    isConnected,
    isInternetReachable,
    state.isOnline,
    state.hasCheckedOnline,
    checkOnlineCapabilities,
  ]);

  return {
    ...state,
    isConnected,
    connectionType,
    isInternetReachable,
    checkOnlineCapabilities,
    retryInternetCheck,
  };
};
