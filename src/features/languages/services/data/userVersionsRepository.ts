import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseManager from '../../../../shared/services/database/DatabaseManager';
import { UserSavedVersion } from '../../../../shared/services/database/schema';
import type { AudioVersion, TextVersion, SavedVersionInput } from '../../types';

const databaseManager = DatabaseManager.getInstance();

// Repository errors
export class UserVersionsRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'UserVersionsRepositoryError';
  }
}

// Pure data access interface for user versions
export interface UserVersionsRepositoryInterface {
  // Saved versions database operations
  getAllSavedVersions(): Promise<UserSavedVersion[]>;
  getSavedVersionsByType(type: 'audio' | 'text'): Promise<UserSavedVersion[]>;
  addSavedVersion(input: SavedVersionInput): Promise<void>;
  removeSavedVersion(versionId: string, type: 'audio' | 'text'): Promise<void>;
  isVersionSaved(versionId: string, type: 'audio' | 'text'): Promise<boolean>;
  clearAllSavedVersions(): Promise<void>;

  // AsyncStorage operations for current selections
  getCurrentAudioVersionFromStorage(): Promise<AudioVersion | null>;
  getCurrentTextVersionFromStorage(): Promise<TextVersion | null>;
  saveCurrentAudioVersionToStorage(version: AudioVersion | null): Promise<void>;
  saveCurrentTextVersionToStorage(version: TextVersion | null): Promise<void>;
  clearCurrentSelectionsFromStorage(): Promise<void>;
}

class UserVersionsRepository implements UserVersionsRepositoryInterface {
  // Database operations for saved versions
  async getAllSavedVersions(): Promise<UserSavedVersion[]> {
    try {
      const db = await databaseManager.getDatabase();
      return await db.getAllAsync<UserSavedVersion>(
        'SELECT * FROM user_saved_versions ORDER BY created_at DESC'
      );
    } catch (error) {
      throw new UserVersionsRepositoryError(
        'Failed to fetch all saved versions',
        'FETCH_ALL_SAVED_FAILED',
        { originalError: error }
      );
    }
  }

  async getSavedVersionsByType(
    type: 'audio' | 'text'
  ): Promise<UserSavedVersion[]> {
    try {
      const db = await databaseManager.getDatabase();
      return await db.getAllAsync<UserSavedVersion>(
        'SELECT * FROM user_saved_versions WHERE version_type = ? ORDER BY created_at DESC',
        [type]
      );
    } catch (error) {
      throw new UserVersionsRepositoryError(
        `Failed to fetch saved ${type} versions`,
        'FETCH_SAVED_BY_TYPE_FAILED',
        { type, originalError: error }
      );
    }
  }

  async addSavedVersion(input: SavedVersionInput): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();

      // Check if already exists
      const existing = await db.getFirstAsync<UserSavedVersion>(
        'SELECT * FROM user_saved_versions WHERE version_type = ? AND version_id = ?',
        [input.versionType, input.versionId]
      );

      if (existing) {
        throw new UserVersionsRepositoryError(
          'Version already saved',
          'VERSION_ALREADY_SAVED',
          { versionId: input.versionId, versionType: input.versionType }
        );
      }

      // Generate unique ID and insert
      const id = `${input.versionType}_${input.versionId}_${Date.now()}`;
      const timestamp = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO user_saved_versions 
         (id, version_type, language_entity_id, language_name, version_id, version_name, created_at, updated_at, synced_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.versionType,
          input.languageEntityId,
          input.languageName,
          input.versionId,
          input.versionName,
          timestamp,
          timestamp,
          timestamp,
        ]
      );
    } catch (error) {
      if (error instanceof UserVersionsRepositoryError) {
        throw error;
      }
      throw new UserVersionsRepositoryError(
        'Failed to add saved version',
        'ADD_SAVED_VERSION_FAILED',
        { input, originalError: error }
      );
    }
  }

  async removeSavedVersion(
    versionId: string,
    type: 'audio' | 'text'
  ): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync(
        'DELETE FROM user_saved_versions WHERE version_type = ? AND version_id = ?',
        [type, versionId]
      );
    } catch (error) {
      throw new UserVersionsRepositoryError(
        'Failed to remove saved version',
        'REMOVE_SAVED_VERSION_FAILED',
        { versionId, type, originalError: error }
      );
    }
  }

  async isVersionSaved(
    versionId: string,
    type: 'audio' | 'text'
  ): Promise<boolean> {
    try {
      const db = await databaseManager.getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM user_saved_versions WHERE version_type = ? AND version_id = ?',
        [type, versionId]
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      throw new UserVersionsRepositoryError(
        'Failed to check if version is saved',
        'CHECK_VERSION_SAVED_FAILED',
        { versionId, type, originalError: error }
      );
    }
  }

  async clearAllSavedVersions(): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync('DELETE FROM user_saved_versions');
    } catch (error) {
      throw new UserVersionsRepositoryError(
        'Failed to clear all saved versions',
        'CLEAR_SAVED_VERSIONS_FAILED',
        { originalError: error }
      );
    }
  }

  // AsyncStorage operations for current selections
  async getCurrentAudioVersionFromStorage(): Promise<AudioVersion | null> {
    try {
      const { STORAGE_KEYS } = await import('../../types');
      const stored = await AsyncStorage.getItem(
        STORAGE_KEYS.CURRENT_AUDIO_VERSION
      );
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      throw new UserVersionsRepositoryError(
        'Failed to get current audio version from storage',
        'GET_AUDIO_FROM_STORAGE_FAILED',
        { originalError: error }
      );
    }
  }

  async getCurrentTextVersionFromStorage(): Promise<TextVersion | null> {
    try {
      const { STORAGE_KEYS } = await import('../../types');
      const stored = await AsyncStorage.getItem(
        STORAGE_KEYS.CURRENT_TEXT_VERSION
      );
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      throw new UserVersionsRepositoryError(
        'Failed to get current text version from storage',
        'GET_TEXT_FROM_STORAGE_FAILED',
        { originalError: error }
      );
    }
  }

  async saveCurrentAudioVersionToStorage(
    version: AudioVersion | null
  ): Promise<void> {
    try {
      const { STORAGE_KEYS } = await import('../../types');
      if (version) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CURRENT_AUDIO_VERSION,
          JSON.stringify(version)
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_AUDIO_VERSION);
      }
    } catch (error) {
      throw new UserVersionsRepositoryError(
        'Failed to save current audio version to storage',
        'SAVE_AUDIO_TO_STORAGE_FAILED',
        { version, originalError: error }
      );
    }
  }

  async saveCurrentTextVersionToStorage(
    version: TextVersion | null
  ): Promise<void> {
    try {
      const { STORAGE_KEYS } = await import('../../types');
      if (version) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CURRENT_TEXT_VERSION,
          JSON.stringify(version)
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_TEXT_VERSION);
      }
    } catch (error) {
      throw new UserVersionsRepositoryError(
        'Failed to save current text version to storage',
        'SAVE_TEXT_TO_STORAGE_FAILED',
        { version, originalError: error }
      );
    }
  }

  async clearCurrentSelectionsFromStorage(): Promise<void> {
    try {
      const { STORAGE_KEYS } = await import('../../types');
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CURRENT_AUDIO_VERSION,
        STORAGE_KEYS.CURRENT_TEXT_VERSION,
        STORAGE_KEYS.LAST_LANGUAGE_SEARCH,
        STORAGE_KEYS.EXPANDED_NODES,
      ]);
    } catch (error) {
      throw new UserVersionsRepositoryError(
        'Failed to clear current selections from storage',
        'CLEAR_STORAGE_FAILED',
        { originalError: error }
      );
    }
  }
}

// Export singleton instance
export const userVersionsRepository = new UserVersionsRepository();
export default userVersionsRepository;
