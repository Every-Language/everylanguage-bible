import { logger } from '../../../utils/logger';

export interface NetworkQualityMetrics {
  latency: number; // milliseconds
  bandwidth: number; // Mbps
  reliability: number; // 0-1
  connectionType: 'wifi' | 'cellular' | 'unknown';
  signalStrength?: number; // 0-5 for cellular
}

export interface DeviceCapabilityMetrics {
  memoryAvailable: number; // MB
  cpuPerformance: 'high' | 'medium' | 'low';
  storageAvailable: number; // MB
  batteryLevel: number; // 0-1
  isCharging: boolean;
}

export interface AdaptiveBatchConfig {
  minBatchSize: number;
  maxBatchSize: number;
  memoryThreshold: number; // MB
  networkQuality: NetworkQualityMetrics;
  deviceCapability: DeviceCapabilityMetrics;
  dataType: 'bible' | 'language' | 'media' | 'verse_text';
  operationType: 'sync' | 'download' | 'upload';
}

export class AdaptiveSyncManager {
  private static instance: AdaptiveSyncManager;
  private networkQualityCache: Map<string, NetworkQualityMetrics> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): AdaptiveSyncManager {
    if (!AdaptiveSyncManager.instance) {
      AdaptiveSyncManager.instance = new AdaptiveSyncManager();
    }
    return AdaptiveSyncManager.instance;
  }

  /**
   * Calculate optimal batch size based on current conditions
   */
  calculateOptimalBatchSize(config: AdaptiveBatchConfig): number {
    const {
      minBatchSize,
      maxBatchSize,
      memoryThreshold,
      networkQuality,
      deviceCapability,
      dataType,
      operationType,
    } = config;

    // Start with base batch size based on data type
    let baseBatchSize = this.getBaseBatchSize(dataType, operationType);

    // Adjust based on network quality
    const networkMultiplier = this.calculateNetworkMultiplier(networkQuality);

    // Adjust based on device capability
    const deviceMultiplier = this.calculateDeviceMultiplier(deviceCapability);

    // Adjust based on available memory
    const memoryMultiplier = this.calculateMemoryMultiplier(
      deviceCapability.memoryAvailable,
      memoryThreshold
    );

    // Calculate final batch size
    let optimalBatchSize = Math.floor(
      baseBatchSize * networkMultiplier * deviceMultiplier * memoryMultiplier
    );

    // Ensure within bounds
    optimalBatchSize = Math.max(
      minBatchSize,
      Math.min(maxBatchSize, optimalBatchSize)
    );

    logger.info('Adaptive batch size calculation:', {
      dataType,
      operationType,
      baseBatchSize,
      networkMultiplier,
      deviceMultiplier,
      memoryMultiplier,
      optimalBatchSize,
      networkQuality,
      deviceCapability: {
        memoryAvailable: deviceCapability.memoryAvailable,
        cpuPerformance: deviceCapability.cpuPerformance,
        batteryLevel: deviceCapability.batteryLevel,
        isCharging: deviceCapability.isCharging,
      },
    });

    return optimalBatchSize;
  }

  /**
   * Get base batch size for different data types
   */
  private getBaseBatchSize(dataType: string, operationType: string): number {
    const baseSizes = {
      bible: { sync: 1000, download: 500, upload: 200 },
      language: { sync: 500, download: 200, upload: 100 },
      media: { sync: 200, download: 50, upload: 20 },
      verse_text: { sync: 500, download: 200, upload: 100 },
    };

    return (
      baseSizes[dataType as keyof typeof baseSizes]?.[
        operationType as keyof typeof baseSizes.bible
      ] || 500
    );
  }

  /**
   * Calculate network quality multiplier
   */
  private calculateNetworkMultiplier(
    networkQuality: NetworkQualityMetrics
  ): number {
    let multiplier = 1.0;

    // Adjust based on connection type
    switch (networkQuality.connectionType) {
      case 'wifi':
        multiplier *= 1.5;
        break;
      case 'cellular':
        multiplier *= 0.7;
        break;
      default:
        multiplier *= 0.5;
    }

    // Adjust based on bandwidth
    if (networkQuality.bandwidth > 10) {
      multiplier *= 1.2;
    } else if (networkQuality.bandwidth < 1) {
      multiplier *= 0.6;
    }

    // Adjust based on latency
    if (networkQuality.latency < 50) {
      multiplier *= 1.1;
    } else if (networkQuality.latency > 200) {
      multiplier *= 0.8;
    }

    // Adjust based on reliability
    multiplier *= networkQuality.reliability;

    return Math.max(0.1, Math.min(2.0, multiplier));
  }

  /**
   * Calculate device capability multiplier
   */
  private calculateDeviceMultiplier(
    deviceCapability: DeviceCapabilityMetrics
  ): number {
    let multiplier = 1.0;

    // Adjust based on CPU performance
    switch (deviceCapability.cpuPerformance) {
      case 'high':
        multiplier *= 1.3;
        break;
      case 'medium':
        multiplier *= 1.0;
        break;
      case 'low':
        multiplier *= 0.7;
        break;
    }

    // Adjust based on battery level and charging status
    if (deviceCapability.isCharging) {
      multiplier *= 1.2;
    } else if (deviceCapability.batteryLevel < 0.2) {
      multiplier *= 0.6;
    } else if (deviceCapability.batteryLevel < 0.5) {
      multiplier *= 0.8;
    }

    return Math.max(0.3, Math.min(1.5, multiplier));
  }

  /**
   * Calculate memory-based multiplier
   */
  private calculateMemoryMultiplier(
    availableMemory: number,
    threshold: number
  ): number {
    if (availableMemory > threshold * 2) {
      return 1.2;
    } else if (availableMemory > threshold) {
      return 1.0;
    } else if (availableMemory > threshold * 0.5) {
      return 0.8;
    } else {
      return 0.5;
    }
  }

  /**
   * Assess network quality
   */
  async assessNetworkQuality(): Promise<NetworkQualityMetrics> {
    const cacheKey = 'network_quality';
    const cached = this.networkQualityCache.get(cacheKey);

    if (cached && Date.now() - Date.now() < this.CACHE_TTL) {
      return cached;
    }

    try {
      const metrics = await this.performNetworkQualityTest();
      this.networkQualityCache.set(cacheKey, metrics);
      return metrics;
    } catch (error) {
      logger.error('Failed to assess network quality:', error);
      return this.getDefaultNetworkQuality();
    }
  }

  /**
   * Perform actual network quality test
   */
  private async performNetworkQualityTest(): Promise<NetworkQualityMetrics> {
    // Simple latency test
    const latency = await this.measureLatency();

    // Estimate bandwidth based on connection type
    const connectionType = await this.getConnectionType();
    const bandwidth = this.estimateBandwidth(connectionType);

    // Calculate reliability based on recent sync success rate
    const reliability = await this.calculateReliability();

    const metrics: NetworkQualityMetrics = {
      latency,
      bandwidth,
      reliability,
      connectionType,
      ...(connectionType === 'cellular' && {
        signalStrength: await this.getSignalStrength(),
      }),
    };

    logger.info('Network quality assessment completed:', metrics);
    return metrics;
  }

  /**
   * Measure network latency
   */
  private async measureLatency(): Promise<number> {
    const testUrl = 'https://api.supabase.co/rest/v1/';
    const startTime = Date.now();

    try {
      await fetch(testUrl, { method: 'HEAD' });
      const endTime = Date.now();
      return endTime - startTime;
    } catch {
      logger.warn('Latency test failed, using default value');
      return 100; // Default latency
    }
  }

  /**
   * Get connection type
   */
  private async getConnectionType(): Promise<'wifi' | 'cellular' | 'unknown'> {
    // This would need to be implemented with actual network detection
    // For now, return a reasonable default
    return 'wifi';
  }

  /**
   * Estimate bandwidth based on connection type
   */
  private estimateBandwidth(connectionType: string): number {
    const estimates = {
      wifi: 50, // Mbps
      cellular: 10, // Mbps
      unknown: 5, // Mbps
    };

    return estimates[connectionType as keyof typeof estimates] || 5;
  }

  /**
   * Calculate reliability based on recent sync success
   */
  private async calculateReliability(): Promise<number> {
    // This would need to track recent sync success rates
    // For now, return a default value
    return 0.9;
  }

  /**
   * Get signal strength for cellular connections
   */
  private async getSignalStrength(): Promise<number> {
    // This would need to be implemented with actual signal strength detection
    // For now, return a default value
    return 3;
  }

  /**
   * Get default network quality when assessment fails
   */
  private getDefaultNetworkQuality(): NetworkQualityMetrics {
    return {
      latency: 100,
      bandwidth: 5,
      reliability: 0.8,
      connectionType: 'unknown',
    };
  }

  /**
   * Get device capability metrics
   */
  async getDeviceCapabilityMetrics(): Promise<DeviceCapabilityMetrics> {
    // This would need to be implemented with actual device capability detection
    // For now, return reasonable defaults
    return {
      memoryAvailable: 1000, // MB
      cpuPerformance: 'medium',
      storageAvailable: 5000, // MB
      batteryLevel: 0.8,
      isCharging: false,
    };
  }

  /**
   * Clear network quality cache
   */
  clearCache(): void {
    this.networkQualityCache.clear();
  }
}
