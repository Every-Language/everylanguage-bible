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
