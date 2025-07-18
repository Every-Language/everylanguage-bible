import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseManager from '../../../shared/services/database/DatabaseManager';

const databaseManager = DatabaseManager.getInstance();
import { supabase } from '../../../shared/services/api/supabase';
import { UserSavedVersion } from '../../../shared/services/database/schema';
import {
  AudioVersion,
  TextVersion,
  SavedVersionInput,
  UserVersionsServiceInterface,
  STORAGE_KEYS,
} from '../types';

class UserVersionsService implements UserVersionsServiceInterface {
  constructor() {}

  /**
   * Get all saved versions for the user from local database
   */
  async getSavedVersions(): Promise<{
    audio: AudioVersion[];
    text: TextVersion[];
  }> {
    try {
      const db = await databaseManager.getDatabase();

      // Get audio versions
      const audioResults = await db.getAllAsync<UserSavedVersion>(
        'SELECT * FROM user_saved_versions WHERE version_type = ? ORDER BY created_at DESC',
        ['audio']
      );

      // Get text versions
      const textResults = await db.getAllAsync<UserSavedVersion>(
        'SELECT * FROM user_saved_versions WHERE version_type = ? ORDER BY created_at DESC',
        ['text']
      );

      // Convert to proper types
      const audioVersions: AudioVersion[] = audioResults.map(result => ({
        id: result.version_id,
        name: result.version_name,
        languageEntityId: result.language_entity_id,
        languageName: result.language_name,
        mediaFileCount: 0, // Will be populated when needed
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      }));

      const textVersions: TextVersion[] = textResults.map(result => ({
        id: result.version_id,
        name: result.version_name,
        languageEntityId: result.language_entity_id,
        languageName: result.language_name,
        source: 'project', // Default, could be enhanced
        verseCount: 0, // Will be populated when needed
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      }));

      return {
        audio: audioVersions,
        text: textVersions,
      };
    } catch (error) {
      console.error('Error getting saved versions:', error);
      throw error;
    }
  }

  /**
   * Add a version to the user's saved list
   */
  async addSavedVersion(input: SavedVersionInput): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();

      // Check if already saved
      const existing = await db.getFirstAsync<UserSavedVersion>(
        'SELECT * FROM user_saved_versions WHERE version_type = ? AND version_id = ?',
        [input.versionType, input.versionId]
      );

      if (existing) {
        console.log('Version already saved:', input.versionId);
        return;
      }

      // Generate unique ID
      const id = `${input.versionType}_${input.versionId}_${Date.now()}`;
      const timestamp = new Date().toISOString();

      // Insert into database
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

      console.log(
        `Added ${input.versionType} version to saved list:`,
        input.versionName
      );

      // Sync with cloud if user is authenticated
      await this.syncSavedVersionsToCloud();
    } catch (error) {
      console.error('Error adding saved version:', error);
      throw error;
    }
  }

  /**
   * Remove a version from the user's saved list
   */
  async removeSavedVersion(
    versionId: string,
    versionType: 'audio' | 'text'
  ): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();

      await db.runAsync(
        'DELETE FROM user_saved_versions WHERE version_type = ? AND version_id = ?',
        [versionType, versionId]
      );

      console.log(`Removed ${versionType} version from saved list:`, versionId);

      // Sync with cloud if user is authenticated
      await this.syncSavedVersionsToCloud();
    } catch (error) {
      console.error('Error removing saved version:', error);
      throw error;
    }
  }

  /**
   * Check if a version is already saved
   */
  async isVersionSaved(
    versionId: string,
    versionType: 'audio' | 'text'
  ): Promise<boolean> {
    try {
      const db = await databaseManager.getDatabase();

      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM user_saved_versions WHERE version_type = ? AND version_id = ?',
        [versionType, versionId]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking if version is saved:', error);
      return false;
    }
  }

  /**
   * Sync saved versions with cloud for authenticated users
   */
  async syncSavedVersions(): Promise<void> {
    try {
      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping cloud sync');
        return;
      }

      // Get local saved versions
      const localVersions = await this.getSavedVersions();

      // Prepare data for cloud storage
      const savedVersionsData = {
        audio_versions: localVersions.audio.map(v => ({
          version_id: v.id,
          version_name: v.name,
          language_entity_id: v.languageEntityId,
          language_name: v.languageName,
        })),
        text_versions: localVersions.text.map(v => ({
          version_id: v.id,
          version_name: v.name,
          language_entity_id: v.languageEntityId,
          language_name: v.languageName,
        })),
        last_synced: new Date().toISOString(),
      };

      // Try to get existing preferences
      const { data: existingPrefs } = await supabase
        .from('user_language_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingPrefs) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_language_preferences')
          .update({
            saved_versions: savedVersionsData,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating cloud preferences:', error);
          throw error;
        }
      } else {
        // Create new preferences record
        const { error } = await supabase
          .from('user_language_preferences')
          .insert({
            user_id: user.id,
            saved_versions: savedVersionsData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error creating cloud preferences:', error);
          throw error;
        }
      }

      console.log('Successfully synced saved versions to cloud');
    } catch (error) {
      console.error('Error syncing saved versions:', error);
      // Don't throw - sync failures shouldn't break local functionality
    }
  }

  /**
   * Get current audio and text version selections
   */
  async getCurrentSelections(): Promise<{
    audio: AudioVersion | null;
    text: TextVersion | null;
  }> {
    try {
      // Try to get from AsyncStorage first
      const audioStorageResult = await AsyncStorage.getItem(
        STORAGE_KEYS.CURRENT_AUDIO_VERSION
      );
      const textStorageResult = await AsyncStorage.getItem(
        STORAGE_KEYS.CURRENT_TEXT_VERSION
      );

      let audioVersion: AudioVersion | null = null;
      let textVersion: TextVersion | null = null;

      if (audioStorageResult) {
        try {
          audioVersion = JSON.parse(audioStorageResult);
        } catch (error) {
          console.error('Error parsing stored audio version:', error);
        }
      }

      if (textStorageResult) {
        try {
          textVersion = JSON.parse(textStorageResult);
        } catch (error) {
          console.error('Error parsing stored text version:', error);
        }
      }

      // If nothing in AsyncStorage, try to get from cloud for authenticated users
      if (!audioVersion && !textVersion) {
        const cloudSelections = await this.getSelectionsFromCloud();
        if (cloudSelections) {
          audioVersion = cloudSelections.audio;
          textVersion = cloudSelections.text;

          // Store to AsyncStorage for future use
          if (audioVersion) {
            await AsyncStorage.setItem(
              STORAGE_KEYS.CURRENT_AUDIO_VERSION,
              JSON.stringify(audioVersion)
            );
          }
          if (textVersion) {
            await AsyncStorage.setItem(
              STORAGE_KEYS.CURRENT_TEXT_VERSION,
              JSON.stringify(textVersion)
            );
          }
        }
      }

      return {
        audio: audioVersion,
        text: textVersion,
      };
    } catch (error) {
      console.error('Error getting current selections:', error);
      return { audio: null, text: null };
    }
  }

  /**
   * Save current audio and text version selections
   */
  async saveCurrentSelections(
    audio: AudioVersion | null,
    text: TextVersion | null
  ): Promise<void> {
    try {
      // Save to AsyncStorage
      if (audio) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CURRENT_AUDIO_VERSION,
          JSON.stringify(audio)
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_AUDIO_VERSION);
      }

      if (text) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CURRENT_TEXT_VERSION,
          JSON.stringify(text)
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_TEXT_VERSION);
      }

      console.log('Saved current selections to AsyncStorage');

      // Sync with cloud for authenticated users
      await this.saveSelectionsToCloud(audio, text);
    } catch (error) {
      console.error('Error saving current selections:', error);
      throw error;
    }
  }

  // Private helper methods

  private async syncSavedVersionsToCloud(): Promise<void> {
    try {
      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // This is called automatically after add/remove operations
      await this.syncSavedVersions();
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      // Don't throw - local operations should continue working
    }
  }

  private async getSelectionsFromCloud(): Promise<{
    audio: AudioVersion | null;
    text: TextVersion | null;
  } | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_language_preferences')
        .select('current_audio_version_id, current_text_version_id')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return null;
      }

      // Note: This would need to be enhanced to fetch full version objects
      // For now, returning null as we don't have the full version data
      return null;
    } catch (error) {
      console.error('Error getting selections from cloud:', error);
      return null;
    }
  }

  private async saveSelectionsToCloud(
    audio: AudioVersion | null,
    text: TextVersion | null
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Check if preferences record exists
      const { data: existingPrefs } = await supabase
        .from('user_language_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const updateData = {
        current_audio_version_id: audio?.id || null,
        current_text_version_id: text?.id || null,
        updated_at: new Date().toISOString(),
      };

      if (existingPrefs) {
        // Update existing record
        const { error } = await supabase
          .from('user_language_preferences')
          .update(updateData)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating cloud selections:', error);
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_language_preferences')
          .insert({
            user_id: user.id,
            ...updateData,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error creating cloud selections:', error);
        }
      }
    } catch (error) {
      console.error('Error saving selections to cloud:', error);
      // Don't throw - local storage should still work
    }
  }

  /**
   * Load saved versions from cloud and merge with local
   */
  async loadSavedVersionsFromCloud(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping cloud sync');
        return;
      }

      const { data, error } = await supabase
        .from('user_language_preferences')
        .select('saved_versions')
        .eq('user_id', user.id)
        .single();

      if (error || !data?.saved_versions) {
        console.log('No cloud saved versions found');
        return;
      }

      const cloudVersions = data.saved_versions as any;
      const db = await databaseManager.getDatabase();

      // Process audio versions
      if (cloudVersions.audio_versions?.length > 0) {
        for (const version of cloudVersions.audio_versions) {
          const existing = await db.getFirstAsync<UserSavedVersion>(
            'SELECT * FROM user_saved_versions WHERE version_type = ? AND version_id = ?',
            ['audio', version.version_id]
          );

          if (!existing) {
            const id = `audio_${version.version_id}_${Date.now()}`;
            const timestamp = new Date().toISOString();

            await db.runAsync(
              `INSERT INTO user_saved_versions 
               (id, version_type, language_entity_id, language_name, version_id, version_name, created_at, updated_at, synced_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                'audio',
                version.language_entity_id,
                version.language_name,
                version.version_id,
                version.version_name,
                timestamp,
                timestamp,
                timestamp,
              ]
            );
          }
        }
      }

      // Process text versions
      if (cloudVersions.text_versions?.length > 0) {
        for (const version of cloudVersions.text_versions) {
          const existing = await db.getFirstAsync<UserSavedVersion>(
            'SELECT * FROM user_saved_versions WHERE version_type = ? AND version_id = ?',
            ['text', version.version_id]
          );

          if (!existing) {
            const id = `text_${version.version_id}_${Date.now()}`;
            const timestamp = new Date().toISOString();

            await db.runAsync(
              `INSERT INTO user_saved_versions 
               (id, version_type, language_entity_id, language_name, version_id, version_name, created_at, updated_at, synced_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                'text',
                version.language_entity_id,
                version.language_name,
                version.version_id,
                version.version_name,
                timestamp,
                timestamp,
                timestamp,
              ]
            );
          }
        }
      }

      console.log('Successfully loaded saved versions from cloud');
    } catch (error) {
      console.error('Error loading saved versions from cloud:', error);
      // Don't throw - local functionality should continue working
    }
  }

  /**
   * Clear all user data (for logout, etc.)
   */
  async clearUserData(): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();

      // Clear saved versions
      await db.runAsync('DELETE FROM user_saved_versions');

      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CURRENT_AUDIO_VERSION,
        STORAGE_KEYS.CURRENT_TEXT_VERSION,
        STORAGE_KEYS.LAST_LANGUAGE_SEARCH,
        STORAGE_KEYS.EXPANDED_NODES,
      ]);

      console.log('Cleared all user language selection data');
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userVersionsService = new UserVersionsService();
export default userVersionsService;
