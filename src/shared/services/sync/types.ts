// Import auto-generated database types for IntelliSense
import type { Database } from '@everylanguage/shared-types';
import { logger } from '@/shared/utils/logger';

// Use flexible types that accept any string but provide IntelliSense for known values
export type SyncStatus = Database['public']['Enums']['upload_status'] | string;
export type VersionType = 'audio' | 'text' | string;
export type Testament = 'OT' | 'NT' | 'old' | 'new' | string | null;

// Configuration for validation behavior
export interface ValidationConfig {
  warnOnUnknownValues: boolean;
  strictMode: boolean; // If true, throws on unknown values
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  warnOnUnknownValues: true,
  strictMode: false,
};

// Generic validation function that can be configured
export const createValidator = <T extends string>(
  knownValues: readonly T[],
  fieldName: string,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
) => {
  return (value: string): string => {
    const isKnown = knownValues.includes(value as T);

    if (!isKnown) {
      const message = `Unknown ${fieldName}: ${value}`;

      if (config.strictMode) {
        throw new Error(message);
      }

      if (config.warnOnUnknownValues) {
        logger.warn(`${message}. Using as-is.`);
      }
    }

    return value;
  };
};

// Optional validators that can be used when needed
// These pull from your auto-generated types when possible
export const validateSyncStatus = createValidator(
  [
    'pending',
    'uploading',
    'completed',
    'failed',
    'idle',
    'syncing',
    'error',
  ] as const,
  'sync status'
);

export const validateVersionType = createValidator(
  ['audio', 'text'] as const,
  'version type'
);

// Special validator for testament that handles null values
export const validateTestament = (value: string | null): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const knownValues = ['OT', 'NT', 'old', 'new'] as const;
  const isKnown = knownValues.includes(value as any);

  if (!isKnown) {
    logger.warn(`Unknown testament: ${value}. Using as-is.`);
  }

  return value;
};

// For cases where you want strict validation
export const createStrictValidator = <T extends string>(
  knownValues: readonly T[],
  fieldName: string
) =>
  createValidator(knownValues, fieldName, {
    warnOnUnknownValues: true,
    strictMode: true,
  });

export interface SyncOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface SyncResult {
  success: boolean;
  tableName: string;
  recordsSynced: number;
  error?: string;
  warning?: string;
}

export interface SyncProgress {
  table: string;
  recordsSynced: number;
  totalRecords?: number;
  isComplete: boolean;
  error?: string;
}

export interface BaseSyncService {
  onSync(listener: (result: SyncResult) => void): () => void;
  isSyncInProgress(): boolean;
}

// SyncMetadata is exported from database/schema.ts - import from there when needed

// Bible-specific sync metadata with version support
export interface BibleSyncMetadata {
  table_name: string;
  last_sync: string;
  total_records: number;
  sync_status: string; // Pure string - validation is optional
  error_message?: string;
  created_at?: string;
  updated_at?: string;
  content_version?: string; // For version-based syncing
  last_version_check?: string; // When we last checked for new versions
}

export interface SyncConfig {
  strategy: string; // Pure string - validation is optional
  checkInterval?: number; // in milliseconds
  autoSync?: boolean;
}
