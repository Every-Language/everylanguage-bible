import { useNetworkCapabilities as useNetworkCapabilitiesFromStore } from '@/shared/hooks/useNetworkState';

/**
 * Hook for network capabilities in downloads feature
 * This is now a simple wrapper around the centralized network store
 */
export const useNetworkCapabilities = () => {
  return useNetworkCapabilitiesFromStore();
};
