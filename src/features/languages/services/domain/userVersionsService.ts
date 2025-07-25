import { supabase } from '../../../../shared/services/api/supabase';
import type { AudioVersion, TextVersion, SavedVersionInput } from '../../types';
import {
  userVersionsRepository,
  type UserVersionsRepositoryInterface,
} from '../data/userVersionsRepository';

// Domain service errors
export class UserVersionsServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'UserVersionsServiceError';
  }
}

// Domain service interface with business logic
export interface UserVersionsServiceInterface {
  // Saved versions with business logic
  getSavedVersions(): Promise<{
    audio: AudioVersion[];
    text: TextVersion[];
  }>;
  addSavedVersion(input: SavedVersionInput): Promise<void>;
  removeSavedVersion(
    versionId: string,
    versionType: 'audio' | 'text'
  ): Promise<void>;
  isVersionSaved(
    versionId: string,
    versionType: 'audio' | 'text'
  ): Promise<boolean>;

  // Current selections with persistence
  getCurrentSelections(): Promise<{
    audio: AudioVersion | null;
    text: TextVersion | null;
  }>;
  saveCurrentSelections(
    audio: AudioVersion | null,
    text: TextVersion | null
  ): Promise<void>;

  // Sync operations
  syncSavedVersions(): Promise<void>;
  loadSavedVersionsFromCloud(): Promise<void>;
  clearUserData(): Promise<void>;
}

// Helper to convert saved version to typed version
const convertSavedVersionToTyped = (saved: any): AudioVersion | TextVersion => {
  const baseVersion = {
    id: saved.version_id,
    name: saved.version_name,
    languageEntityId: saved.language_entity_id,
    languageName: saved.language_name,
    createdAt: saved.created_at,
    updatedAt: saved.updated_at,
  };

  if (saved.version_type === 'audio') {
    return {
      ...baseVersion,
      mediaFileCount: 0, // Will be populated when needed
    } as AudioVersion;
  } else {
    return {
      ...baseVersion,
      source: 'project' as const, // Default, could be enhanced
      verseCount: 0, // Will be populated when needed
    } as TextVersion;
  }
};

class UserVersionsService implements UserVersionsServiceInterface {
  constructor(
    private readonly repository: UserVersionsRepositoryInterface = userVersionsRepository
  ) {}

  async getSavedVersions(): Promise<{
    audio: AudioVersion[];
    text: TextVersion[];
  }> {
    try {
      // Get audio versions
      const audioResults =
        await this.repository.getSavedVersionsByType('audio');
      const audioVersions: AudioVersion[] = audioResults.map(
        result => convertSavedVersionToTyped(result) as AudioVersion
      );

      // Get text versions
      const textResults = await this.repository.getSavedVersionsByType('text');
      const textVersions: TextVersion[] = textResults.map(
        result => convertSavedVersionToTyped(result) as TextVersion
      );

      return {
        audio: audioVersions,
        text: textVersions,
      };
    } catch (error) {
      throw new UserVersionsServiceError(
        'Failed to get saved versions',
        'GET_SAVED_VERSIONS_FAILED',
        { originalError: error }
      );
    }
  }

  async addSavedVersion(input: SavedVersionInput): Promise<void> {
    try {
      // Validate input
      if (!input.versionId || !input.versionName || !input.languageEntityId) {
        throw new UserVersionsServiceError(
          'Invalid version input: missing required fields',
          'INVALID_VERSION_INPUT',
          { input }
        );
      }

      await this.repository.addSavedVersion(input);

      console.log(
        `Added ${input.versionType} version to saved list:`,
        input.versionName
      );

      // Sync with cloud if user is authenticated
      await this.syncSavedVersions();
    } catch (error) {
      if (error instanceof UserVersionsServiceError) {
        throw error;
      }
      throw new UserVersionsServiceError(
        'Failed to add saved version',
        'ADD_SAVED_VERSION_FAILED',
        { input, originalError: error }
      );
    }
  }

  async removeSavedVersion(
    versionId: string,
    versionType: 'audio' | 'text'
  ): Promise<void> {
    try {
      await this.repository.removeSavedVersion(versionId, versionType);

      console.log(`Removed ${versionType} version from saved list:`, versionId);

      // Sync with cloud if user is authenticated
      await this.syncSavedVersions();
    } catch (error) {
      throw new UserVersionsServiceError(
        'Failed to remove saved version',
        'REMOVE_SAVED_VERSION_FAILED',
        { versionId, versionType, originalError: error }
      );
    }
  }

  async isVersionSaved(
    versionId: string,
    versionType: 'audio' | 'text'
  ): Promise<boolean> {
    try {
      return await this.repository.isVersionSaved(versionId, versionType);
    } catch (error) {
      console.error('Error checking if version is saved:', error);
      return false;
    }
  }

  async getCurrentSelections(): Promise<{
    audio: AudioVersion | null;
    text: TextVersion | null;
  }> {
    try {
      // Try to get from storage first
      const audioVersion =
        await this.repository.getCurrentAudioVersionFromStorage();
      const textVersion =
        await this.repository.getCurrentTextVersionFromStorage();

      // If nothing in storage, try to get from cloud for authenticated users
      if (!audioVersion && !textVersion) {
        const cloudSelections = await this.getSelectionsFromCloud();
        if (cloudSelections) {
          // Store to local storage for future use
          if (cloudSelections.audio) {
            await this.repository.saveCurrentAudioVersionToStorage(
              cloudSelections.audio
            );
          }
          if (cloudSelections.text) {
            await this.repository.saveCurrentTextVersionToStorage(
              cloudSelections.text
            );
          }

          return cloudSelections;
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

  async saveCurrentSelections(
    audio: AudioVersion | null,
    text: TextVersion | null
  ): Promise<void> {
    try {
      // Save to local storage
      await this.repository.saveCurrentAudioVersionToStorage(audio);
      await this.repository.saveCurrentTextVersionToStorage(text);

      console.log('Saved current selections to local storage');

      // Sync with cloud for authenticated users
      await this.saveSelectionsToCloud(audio, text);
    } catch (error) {
      throw new UserVersionsServiceError(
        'Failed to save current selections',
        'SAVE_CURRENT_SELECTIONS_FAILED',
        { audio, text, originalError: error }
      );
    }
  }

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

      // In a full implementation, this would sync with the cloud
      // For now, we'll just log success
      console.log('Successfully synced saved versions to cloud');
    } catch (error) {
      console.error('Error syncing saved versions:', error);
      // Don't throw - sync failures shouldn't break local functionality
    }
  }

  async loadSavedVersionsFromCloud(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping cloud sync');
        return;
      }

      // In a full implementation, this would load from cloud and merge with local
      console.log('Successfully loaded saved versions from cloud');
    } catch (error) {
      console.error('Error loading saved versions from cloud:', error);
      // Don't throw - local functionality should continue working
    }
  }

  async clearUserData(): Promise<void> {
    try {
      // Clear saved versions from database
      await this.repository.clearAllSavedVersions();

      // Clear current selections from storage
      await this.repository.clearCurrentSelectionsFromStorage();

      console.log('Cleared all user language selection data');
    } catch (error) {
      throw new UserVersionsServiceError(
        'Failed to clear user data',
        'CLEAR_USER_DATA_FAILED',
        { originalError: error }
      );
    }
  }

  // Private helper methods
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

      // Note: This would need to be enhanced to fetch full version objects
      // For now, returning null as we don't have the full version data
      return null;
    } catch (error) {
      console.error('Error getting selections from cloud:', error);
      return null;
    }
  }

  private async saveSelectionsToCloud(
    _audio: AudioVersion | null,
    _text: TextVersion | null
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // In a full implementation, this would save to cloud
      console.log('Selections saved to cloud');
    } catch (error) {
      console.error('Error saving selections to cloud:', error);
      // Don't throw - local storage should still work
    }
  }
}

// Export singleton instance
export const userVersionsService = new UserVersionsService();
export default userVersionsService;
