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

    // First check if we have basic network connectivity
    const networkState = await this.getNetworkState();
    logger.info('NetworkService: Current network state:', networkState);

    if (!networkState.isConnected) {
      logger.warn('NetworkService: No network connection detected');
      return false;
    }

    try {
      // Use a simple timeout approach instead of AbortController
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });

      // Try multiple endpoints for better reliability
      const testEndpoints = [
        'https://httpbin.org/get',
        'https://jsonplaceholder.typicode.com/posts/1',
        'https://api.github.com/zen',
      ];

      for (const endpoint of testEndpoints) {
        try {
          logger.info(`NetworkService: Trying endpoint: ${endpoint}`);
          const fetchPromise = fetch(endpoint, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'User-Agent': 'BibleApp/1.0',
            },
          });

          const response = await Promise.race([fetchPromise, timeoutPromise]);
          logger.info('NetworkService: Fetch response status:', {
            endpoint: endpoint,
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
          });

          if (response.ok) {
            logger.info(
              `NetworkService: Successfully connected to ${endpoint}`
            );
            return true;
          } else {
            logger.warn(
              `NetworkService: Response not OK for ${endpoint}:`,
              response.status,
              response.statusText
            );
          }
        } catch (endpointError) {
          logger.warn(`NetworkService: Failed to connect to ${endpoint}:`, {
            error: endpointError,
            errorMessage: (endpointError as any)?.message || 'No message',
          });
          // Continue to next endpoint
        }
      }

      logger.error('NetworkService: All endpoints failed');
      return false;
    } catch (error) {
      logger.error('NetworkService: Fetch request failed:', {
        error: error,
        errorType: typeof error,
        errorConstructor: (error as any)?.constructor?.name,
        errorMessage: (error as any)?.message || 'No message',
        errorStack: (error as any)?.stack || 'No stack',
        networkState: networkState,
      });
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

  /**
   * Debug method to test network connectivity with detailed logging
   */
  static async debugNetworkConnectivity(): Promise<void> {
    logger.info('NetworkService: Starting debug network connectivity test...');

    try {
      // Check basic network state
      const networkState = await this.getNetworkState();
      logger.info('NetworkService: Debug - Network state:', networkState);

      // Check if NetInfo reports internet reachability
      if (networkState.isInternetReachable === false) {
        logger.warn(
          'NetworkService: Debug - NetInfo reports no internet reachability'
        );
      } else if (networkState.isInternetReachable === true) {
        logger.info(
          'NetworkService: Debug - NetInfo reports internet is reachable'
        );
      } else {
        logger.info(
          'NetworkService: Debug - NetInfo reports unknown internet reachability'
        );
      }

      // Test actual connectivity
      const isOnline = await this.checkOnlineCapabilities();
      logger.info(
        'NetworkService: Debug - Online capabilities check result:',
        isOnline
      );
    } catch (error) {
      logger.error('NetworkService: Debug - Error during network test:', {
        error: error,
        errorMessage: (error as any)?.message || 'No message',
      });
    }
  }
}
