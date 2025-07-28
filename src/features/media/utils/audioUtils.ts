import * as FileSystem from 'expo-file-system';
import { logger } from '@/shared/utils/logger';
import { formatFileSize } from '@/features/downloads/utils/fileUtils';

export interface AudioFileInfo {
  exists: boolean;
  size: number;
  sizeFormatted: string;
  uri: string;
  isValid: boolean;
  error?: string;
}

/**
 * Audio utility functions for consistent time formatting and audio operations
 */

/**
 * Format time in seconds to MM:SS or HH:MM:SS format
 * Truncates to standard decimal places (no decimal places for display)
 * @param seconds - Time in seconds (can have decimal places)
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  // Truncate to whole seconds for display
  const truncatedSeconds = Math.floor(seconds);

  const hours = Math.floor(truncatedSeconds / 3600);
  const minutes = Math.floor((truncatedSeconds % 3600) / 60);
  const secs = truncatedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

/**
 * Format duration for display (e.g., "2m 30s" or "1h 15m 30s")
 * Truncates to standard decimal places
 * @param seconds - Duration in seconds (can have decimal places)
 * @returns Formatted duration string
 */
export const formatDuration = (seconds: number): string => {
  // Truncate to whole seconds for display
  const truncatedSeconds = Math.floor(seconds);

  const hours = Math.floor(truncatedSeconds / 3600);
  const minutes = Math.floor((truncatedSeconds % 3600) / 60);
  const secs = truncatedSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Truncate time value to standard decimal places for internal use
 * @param seconds - Time in seconds with potential many decimal places
 * @param decimalPlaces - Number of decimal places to keep (default: 1)
 * @returns Truncated time value
 */
export const truncateTime = (
  seconds: number,
  decimalPlaces: number = 1
): number => {
  const factor = Math.pow(10, decimalPlaces);
  return Math.floor(seconds * factor) / factor;
};

/**
 * Validate and sanitize time values
 * @param time - Time value to validate
 * @returns Sanitized time value
 */
export const sanitizeTime = (time: number): number => {
  if (isNaN(time) || !isFinite(time)) {
    return 0;
  }
  return Math.max(0, time);
};

/**
 * Validate an audio file before attempting to load it
 */
export async function validateAudioFile(
  filePath: string
): Promise<AudioFileInfo> {
  const fileUri = filePath.startsWith('file://')
    ? filePath
    : `file://${filePath}`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      return {
        exists: false,
        size: 0,
        sizeFormatted: '0 B',
        uri: fileUri,
        isValid: false,
        error: 'File does not exist',
      };
    }

    if (fileInfo.size === 0) {
      return {
        exists: true,
        size: 0,
        sizeFormatted: '0 B',
        uri: fileUri,
        isValid: false,
        error: 'File is empty or corrupted',
      };
    }

    // Check if file size is reasonable (between 1KB and 1GB)
    const minSize = 1024; // 1KB
    const maxSize = 1024 * 1024 * 1024; // 1GB

    if (fileInfo.size < minSize) {
      return {
        exists: true,
        size: fileInfo.size,
        sizeFormatted: formatFileSize(fileInfo.size),
        uri: fileUri,
        isValid: false,
        error: `File size too small (${formatFileSize(fileInfo.size)}) - likely corrupted`,
      };
    }

    if (fileInfo.size > maxSize) {
      return {
        exists: true,
        size: fileInfo.size,
        sizeFormatted: formatFileSize(fileInfo.size),
        uri: fileUri,
        isValid: false,
        error: `File size too large (${formatFileSize(fileInfo.size)}) - may cause performance issues`,
      };
    }

    return {
      exists: true,
      size: fileInfo.size,
      sizeFormatted: formatFileSize(fileInfo.size),
      uri: fileUri,
      isValid: true,
    };
  } catch (error) {
    // logger.error('Error validating audio file:', { fileUri, error });
    return {
      exists: false,
      size: 0,
      sizeFormatted: '0 B',
      uri: fileUri,
      isValid: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error during validation',
    };
  }
}

/**
 * Wait for audio to be ready with timeout and progress logging
 */
export async function waitForAudioReady(
  isReadyCheck: () => boolean,
  options: {
    timeoutMs?: number;
    checkIntervalMs?: number;
    onProgress?: (attempts: number, timeElapsed: number) => void;
  } = {}
): Promise<{
  success: boolean;
  attempts: number;
  timeElapsed: number;
  error?: string;
}> {
  const { timeoutMs = 15000, checkIntervalMs = 500, onProgress } = options;

  const maxChecks = Math.floor(timeoutMs / checkIntervalMs);
  let attempts = 0;
  let timeElapsed = 0;

  while (attempts < maxChecks) {
    if (isReadyCheck()) {
      return { success: true, attempts, timeElapsed };
    }

    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
    attempts++;
    timeElapsed = attempts * checkIntervalMs;

    if (onProgress) {
      onProgress(attempts, timeElapsed);
    }
  }

  return {
    success: false,
    attempts,
    timeElapsed,
    error: `Audio failed to load within ${timeoutMs / 1000} seconds`,
  };
}

/**
 * Retry audio loading with exponential backoff
 */
export async function retryAudioLoad<T>(
  loadFunction: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 5000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await loadFunction();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries) {
        throw lastError;
      }

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelayMs
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Get audio file metadata for debugging
 */
export async function getAudioFileMetadata(filePath: string): Promise<{
  fileInfo: AudioFileInfo;
  additionalInfo: {
    lastModified?: Date;
    isDirectory: boolean;
    canRead: boolean;
  };
}> {
  const fileInfo = await validateAudioFile(filePath);

  try {
    const additionalInfo = await FileSystem.getInfoAsync(fileInfo.uri, {
      size: true,
      md5: false,
    });

    return {
      fileInfo,
      additionalInfo: {
        isDirectory: additionalInfo.isDirectory || false,
        canRead: additionalInfo.exists || false,
      },
    };
  } catch (error) {
    logger.warn('Could not get additional file metadata:', { filePath, error });
    return {
      fileInfo,
      additionalInfo: {
        isDirectory: false,
        canRead: false,
      },
    };
  }
}
