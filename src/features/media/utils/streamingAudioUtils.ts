import * as FileSystem from 'expo-file-system';
import { logger } from '@/shared/utils/logger';

export interface PartialFileInfo {
  isValid: boolean;
  fileSize: number;
  isComplete: boolean;
  canPlay: boolean;
  error?: string;
}

/**
 * Enhanced audio file validation that supports partial files
 */
export async function validatePartialAudioFile(
  filePath: string,
  expectedSize?: number
): Promise<PartialFileInfo> {
  const fileUri = filePath.startsWith('file://')
    ? filePath
    : `file://${filePath}`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      return {
        isValid: false,
        fileSize: 0,
        isComplete: false,
        canPlay: false,
        error: 'File does not exist',
      };
    }

    if (fileInfo.size === 0) {
      return {
        isValid: false,
        fileSize: 0,
        isComplete: false,
        canPlay: false,
        error: 'File is empty',
      };
    }

    // Check if file is complete
    const isComplete = expectedSize ? fileInfo.size >= expectedSize : false;

    // Determine if file can be played
    // Most audio formats can be played partially if they have enough data
    const minPlayableSize = 1024 * 1024; // 1MB minimum
    const canPlay = fileInfo.size >= minPlayableSize;

    // Check for reasonable file size
    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (fileInfo.size > maxSize) {
      return {
        isValid: false,
        fileSize: fileInfo.size,
        isComplete,
        canPlay: false,
        error: 'File size too large',
      };
    }

    return {
      isValid: true,
      fileSize: fileInfo.size,
      isComplete,
      canPlay,
    };
  } catch (error) {
    return {
      isValid: false,
      fileSize: 0,
      isComplete: false,
      canPlay: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

/**
 * Calculate the estimated duration of a partial audio file
 */
export function estimatePartialFileDuration(
  fileSize: number,
  totalFileSize: number,
  totalDuration: number
): number {
  if (fileSize >= totalFileSize) {
    return totalDuration;
  }

  // Estimate based on file size ratio
  const ratio = fileSize / totalFileSize;
  return Math.floor(totalDuration * ratio);
}

/**
 * Check if a partial file has enough data for smooth playback
 */
export function hasEnoughDataForPlayback(
  fileSize: number,
  totalFileSize: number,
  minBufferRatio: number = 0.1 // 10% minimum
): boolean {
  if (fileSize >= totalFileSize) {
    return true; // Complete file
  }

  const bufferRatio = fileSize / totalFileSize;
  return bufferRatio >= minBufferRatio;
}

/**
 * Get playback constraints for a partial file
 */
export function getPartialFilePlaybackConstraints(
  fileSize: number,
  totalFileSize: number,
  totalDuration: number
): {
  maxSeekPosition: number;
  estimatedDuration: number;
  canSeek: boolean;
} {
  const estimatedDuration = estimatePartialFileDuration(
    fileSize,
    totalFileSize,
    totalDuration
  );

  // Allow seeking up to the estimated available duration
  const maxSeekPosition = Math.max(0, estimatedDuration - 30); // 30 second buffer

  // Only allow seeking if we have substantial data
  const canSeek = fileSize / totalFileSize > 0.2; // 20% minimum for seeking

  return {
    maxSeekPosition,
    estimatedDuration,
    canSeek,
  };
}

/**
 * Monitor file growth for streaming downloads
 */
export async function monitorFileGrowth(
  filePath: string,
  onProgress: (fileSize: number) => void,
  intervalMs: number = 1000
): Promise<() => void> {
  let lastSize = 0;
  let isMonitoring = true;

  const checkSize = async () => {
    if (!isMonitoring) return;

    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && fileInfo.size > lastSize) {
        lastSize = fileInfo.size;
        onProgress(fileInfo.size);
      }
    } catch (error) {
      logger.warn('Error monitoring file growth:', error);
    }

    if (isMonitoring) {
      setTimeout(checkSize, intervalMs);
    }
  };

  checkSize();

  // Return stop function
  return () => {
    isMonitoring = false;
  };
}

/**
 * Create a streaming audio source that adapts to partial files
 */
export function createStreamingAudioSource(
  filePath: string,
  options: {
    expectedSize?: number;
    totalDuration?: number;
    onFileGrowth?: (fileSize: number) => void;
  } = {}
): {
  uri: string;
  metadata?: {
    duration?: number;
    isPartial?: boolean;
  };
} {
  const { expectedSize, totalDuration, onFileGrowth } = options;

  // Start monitoring file growth if callback provided
  if (onFileGrowth) {
    monitorFileGrowth(filePath, onFileGrowth).catch(error => {
      logger.warn('Failed to start file monitoring:', error);
    });
  }

  return {
    uri: filePath.startsWith('file://') ? filePath : `file://${filePath}`,
    metadata: {
      ...(totalDuration && { duration: totalDuration }),
      isPartial: expectedSize ? true : false,
    },
  };
}
