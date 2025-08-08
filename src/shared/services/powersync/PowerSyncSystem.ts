/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PowerSyncDatabase,
  SyncStreamConnectionMethod,
} from '@powersync/react-native';
import { OPSqliteOpenFactory } from '@powersync/op-sqlite';
import { AppSchema } from '../../../../powersync/AppSchema';
import { PowerSyncConnector } from './PowerSyncConnector';
import { logger } from '@/shared/utils/logger';

/**
 * PowerSync Database System
 *
 * Manages the PowerSync database instance and connection lifecycle.
 * Uses OP-SQLite for better encryption support and New Architecture compatibility.
 */
class PowerSyncSystem {
  private static instance: PowerSyncSystem;
  private _powersync: PowerSyncDatabase | null = null;
  private _connector: PowerSyncConnector | null = null;
  private _isInitialized = false;
  private _connectionMethod: SyncStreamConnectionMethod =
    SyncStreamConnectionMethod.WEB_SOCKET;

  private constructor() {}

  public static getInstance(): PowerSyncSystem {
    if (!PowerSyncSystem.instance) {
      PowerSyncSystem.instance = new PowerSyncSystem();
    }
    return PowerSyncSystem.instance;
  }

  /**
   * Initialize the PowerSync database
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized && this._powersync) {
      logger.info('PowerSync: Already initialized');
      return;
    }

    try {
      logger.info('PowerSync: Initializing database with OP-SQLite...');

      // Create OP-SQLite factory (recommended for React Native)
      const opSqliteFactory = new OPSqliteOpenFactory({
        dbFilename: 'powersync-everylanguage.db',
        // Optional: Enable encryption
        // encryptionKey: 'your-encryption-key-here'
      });

      // Create PowerSync database instance
      this._powersync = new PowerSyncDatabase({
        schema: AppSchema,
        database: opSqliteFactory,
      });

      // Initialize the database
      await this._powersync.init();

      this._isInitialized = true;
      logger.info('PowerSync: Database initialized successfully');
    } catch (error) {
      logger.error('PowerSync: Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Set the connection method (HTTP or WebSocket)
   */
  public setConnectionMethod(method: SyncStreamConnectionMethod): void {
    this._connectionMethod = method;
    logger.info(
      `PowerSync: Connection method set to ${method === SyncStreamConnectionMethod.HTTP ? 'HTTP Streaming' : 'WebSocket'}`
    );
  }

  /**
   * Get the current connection method
   */
  public getConnectionMethod(): string {
    return this._connectionMethod === SyncStreamConnectionMethod.HTTP
      ? 'HTTP Streaming'
      : 'WebSocket';
  }

  /**
   * Connect to PowerSync backend with automatic fallback
   * Tries WebSocket first, falls back to HTTP streaming on failure
   */
  public async connect(): Promise<void> {
    if (!this._powersync) {
      throw new Error(
        'PowerSync database not initialized. Call initialize() first.'
      );
    }

    if (!this._connector) {
      logger.info('PowerSync: Creating backend connector...');
      this._connector = new PowerSyncConnector();
    }

    // First try WebSocket (default)
    try {
      this._connectionMethod = SyncStreamConnectionMethod.WEB_SOCKET;
      logger.info('PowerSync: Attempting WebSocket connection...');

      await this._powersync.connect(this._connector, {
        connectionMethod: this._connectionMethod,
      });

      logger.info('PowerSync: Connected successfully via WebSocket');
      return;
    } catch (webSocketError) {
      logger.warn(
        'PowerSync: WebSocket connection failed, trying HTTP streaming fallback:',
        webSocketError
      );

      // Disconnect if partially connected
      try {
        await this._powersync.disconnect();
      } catch {
        // Ignore disconnect errors during fallback
      }

      // Wait a moment before retry
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try HTTP streaming fallback
      try {
        this._connectionMethod = SyncStreamConnectionMethod.HTTP;
        logger.info('PowerSync: Attempting HTTP streaming connection...');

        await this._powersync.connect(this._connector, {
          connectionMethod: this._connectionMethod,
        });

        logger.info(
          'PowerSync: Connected successfully via HTTP streaming (fallback)'
        );
        return;
      } catch (httpError) {
        logger.error(
          'PowerSync: Both WebSocket and HTTP streaming failed:',
          httpError
        );
        throw new Error(
          `PowerSync connection failed: WebSocket (${webSocketError}), HTTP (${httpError})`
        );
      }
    }
  }

  /**
   * Disconnect from PowerSync backend
   */
  public async disconnect(): Promise<void> {
    if (this._powersync) {
      logger.info('PowerSync: Disconnecting from backend...');
      await this._powersync.disconnect();
      logger.info('PowerSync: Disconnected successfully');
    }
  }

  /**
   * Get the PowerSync database instance
   */
  public get database(): PowerSyncDatabase {
    if (!this._powersync) {
      throw new Error(
        'PowerSync database not initialized. Call initialize() first.'
      );
    }
    return this._powersync;
  }

  /**
   * Check if PowerSync is initialized
   */
  public get isInitialized(): boolean {
    return this._isInitialized && this._powersync !== null;
  }

  /**
   * Check if PowerSync is connected
   */
  public get isConnected(): boolean {
    return this._powersync?.connected ?? false;
  }

  /**
   * Get connection status
   */
  public getStatus() {
    return {
      initialized: this.isInitialized,
      connected: this.isConnected,
      connectionMethod: this.getConnectionMethod(),
      status: this._powersync?.currentStatus ?? null,
    };
  }

  /**
   * Execute a SQL query (for reads)
   */
  public async execute(sql: string, parameters?: any[]): Promise<any> {
    return this.database.execute(sql, parameters);
  }

  /**
   * Get all rows from a query
   */
  public async getAll(sql: string, parameters?: any[]): Promise<any[]> {
    return this.database.getAll(sql, parameters);
  }

  /**
   * Get a single row from a query
   */
  public async get(sql: string, parameters?: any[]): Promise<any> {
    return this.database.get(sql, parameters);
  }

  /**
   * Watch a query for changes
   */
  public watch(sql: string, parameters?: any[]) {
    return this.database.watch(sql, parameters);
  }
}

// Export singleton instance
export const powerSyncSystem = PowerSyncSystem.getInstance();
export default PowerSyncSystem;
