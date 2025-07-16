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
  sync_status: 'idle' | 'syncing' | 'error';
  error_message?: string;
  created_at?: string;
  updated_at?: string;
  content_version?: string; // For version-based syncing
  last_version_check?: string; // When we last checked for new versions
}

export type SyncStrategy = 'timestamp' | 'version' | 'manual';

export interface SyncConfig {
  strategy: SyncStrategy;
  checkInterval?: number; // in milliseconds
  autoSync?: boolean;
}
