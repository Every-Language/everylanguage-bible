import NetInfo from '@react-native-community/netinfo';
import { MaterialIcons } from '@expo/vector-icons';
import { logger } from '@/shared/utils/logger';

export interface NetworkState {
  isConnected: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
}

export interface NetworkStatusInfo {
  text: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

export class NetworkService {
  /**
   * Check if device has internet connectivity by making a test request
   */
  static async checkOnlineCapabilities(): Promise<boolean> {
    logger.info('NetworkService: Starting online capabilities check...');
    try {
      // Use a simple timeout approach instead of AbortController
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });

      logger.info('NetworkService: Making fetch request to httpbin.org...');
      const fetchPromise = fetch('https://httpbin.org/get', {
        method: 'GET',
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      logger.info('NetworkService: Fetch response status:', {
        status: response.status,
        ok: response.ok,
      });
      return response.ok;
    } catch (error) {
      logger.error('NetworkService: Fetch request failed:', error);
      return false;
    }
  }

  /**
   * Get current network state
   */
  static async getNetworkState(): Promise<NetworkState> {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected ?? false,
      connectionType: state.type,
      isInternetReachable: state.isInternetReachable,
    };
  }

  /**
   * Get network status information for UI display
   */
  static getNetworkStatusInfo(
    networkState: NetworkState,
    theme: { colors: { error: string; success: string; textSecondary: string } }
  ): NetworkStatusInfo {
    const { isConnected, connectionType, isInternetReachable } = networkState;

    if (!isConnected) {
      return {
        text: 'No network connection',
        icon: 'cloud-off',
        color: theme.colors.error,
      };
    }

    if (isInternetReachable === false) {
      return {
        text: 'No internet access',
        icon: 'wifi-off',
        color: theme.colors.error,
      };
    }

    switch (connectionType) {
      case 'wifi':
        return {
          text: 'WiFi connected',
          icon: 'wifi',
          color: theme.colors.success,
        };
      case 'cellular':
        return {
          text: 'Mobile data connected',
          icon: 'signal-cellular-4-bar',
          color: theme.colors.success,
        };
      case 'bluetooth':
        return {
          text: 'Bluetooth connected',
          icon: 'bluetooth',
          color: theme.colors.success,
        };
      case 'ethernet':
        return {
          text: 'Ethernet connected',
          icon: 'cable',
          color: theme.colors.success,
        };
      default:
        return {
          text: 'Network connected',
          icon: 'language',
          color: theme.colors.success,
        };
    }
  }

  /**
   * Check if network is available for downloads
   */
  static isNetworkAvailableForDownloads(networkState: NetworkState): boolean {
    return (
      networkState.isConnected && networkState.isInternetReachable === true
    );
  }

  /**
   * Get network status text for display
   */
  static getNetworkStatusText(networkState: NetworkState): string {
    const { isConnected, connectionType, isInternetReachable } = networkState;

    if (!isConnected) {
      return 'No network connection';
    }

    if (isInternetReachable === false) {
      return 'No internet access';
    }

    switch (connectionType) {
      case 'wifi':
        return 'WiFi connected';
      case 'cellular':
        return 'Mobile data connected';
      case 'bluetooth':
        return 'Bluetooth connected';
      case 'ethernet':
        return 'Ethernet connected';
      default:
        return 'Network connected';
    }
  }

  /**
   * Get network icon for display
   */
  static getNetworkIcon(
    networkState: NetworkState
  ): keyof typeof MaterialIcons.glyphMap {
    const { isConnected, connectionType, isInternetReachable } = networkState;

    if (!isConnected) return 'cloud-off';
    if (isInternetReachable === false) return 'wifi-off';

    switch (connectionType) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'signal-cellular-4-bar';
      case 'bluetooth':
        return 'bluetooth';
      case 'ethernet':
        return 'cable';
      default:
        return 'language';
    }
  }

  /**
   * Get network status color for display
   */
  static getNetworkStatusColor(
    networkState: NetworkState,
    theme: { colors: { error: string; success: string } }
  ): string {
    const { isConnected, isInternetReachable } = networkState;

    if (!isConnected || isInternetReachable === false) {
      return theme.colors.error;
    }
    return theme.colors.success;
  }

  /**
   * Subscribe to network state changes
   */
  static subscribeToNetworkChanges(callback: (state: NetworkState) => void) {
    return NetInfo.addEventListener(state => {
      const networkState: NetworkState = {
        isConnected: state.isConnected ?? false,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable,
      };
      callback(networkState);
    });
  }
}
