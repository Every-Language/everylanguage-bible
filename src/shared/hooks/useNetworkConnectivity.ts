import { useState, useEffect } from 'react';
import { NetworkService, NetworkState } from '../services/network';

export { NetworkState } from '../services/network';

export const useNetworkConnectivity = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: false,
    connectionType: null,
    isInternetReachable: null,
  });

  useEffect(() => {
    // Get initial state
    const getInitialState = async () => {
      const state = await NetworkService.getNetworkState();
      setNetworkState(state);
    };

    getInitialState();

    // Subscribe to network state changes
    const unsubscribe = NetworkService.subscribeToNetworkChanges(state => {
      setNetworkState(state);
    });

    return unsubscribe;
  }, []);

  return networkState;
};
