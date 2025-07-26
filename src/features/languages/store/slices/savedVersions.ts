import { StateCreator } from 'zustand';
import { userVersionsService } from '../../services/domain/userVersionsService';
import type {
  AudioVersion,
  TextVersion,
  SavedVersionInput,
} from '../../types/entities';
import { logger } from '../../../../shared/utils/logger';

// Saved Versions Slice State
export interface SavedVersionsState {
  savedAudioVersions: AudioVersion[];
  savedTextVersions: TextVersion[];
  isLoadingVersions: boolean;
  versionsError: string | null;
}

// Saved Versions Slice Actions
export interface SavedVersionsActions {
  addSavedVersion: (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => Promise<void>;
  removeSavedVersion: (
    versionId: string,
    type: 'audio' | 'text'
  ) => Promise<void>;
  loadSavedVersions: () => Promise<void>;
  isVersionSaved: (versionId: string, type: 'audio' | 'text') => boolean;
  clearVersionsError: () => void;
}

// Combined slice type
export type SavedVersionsSlice = SavedVersionsState & SavedVersionsActions;

// Slice creator function
export const createSavedVersionsSlice: StateCreator<
  SavedVersionsSlice,
  [],
  [],
  SavedVersionsSlice
> = (set, get) => ({
  // Initial state
  savedAudioVersions: [],
  savedTextVersions: [],
  isLoadingVersions: false,
  versionsError: null,

  // Actions
  addSavedVersion: async (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => {
    try {
      set({ versionsError: null });

      const savedVersionInput: SavedVersionInput = {
        versionType: type,
        languageEntityId: version.languageEntityId,
        languageName: version.languageName,
        versionId: version.id,
        versionName: version.name,
      };

      // Check if already saved
      const isAlreadySaved = await userVersionsService.isVersionSaved(
        version.id,
        type
      );

      if (isAlreadySaved) {
        set({
          versionsError: `${version.name} is already in your saved versions`,
        });
        return;
      }

      await userVersionsService.addSavedVersion(savedVersionInput);

      // Update local state
      if (type === 'audio') {
        set(state => ({
          savedAudioVersions: [
            ...state.savedAudioVersions,
            version as AudioVersion,
          ],
        }));
      } else {
        set(state => ({
          savedTextVersions: [
            ...state.savedTextVersions,
            version as TextVersion,
          ],
        }));
      }

      logger.info(`Added ${type} version to saved list:`, version.name);
    } catch (error) {
      logger.error('Error adding saved version:', error);
      set({ versionsError: `Failed to add ${version.name} to saved versions` });
      throw error;
    }
  },

  removeSavedVersion: async (versionId: string, type: 'audio' | 'text') => {
    try {
      set({ versionsError: null });

      await userVersionsService.removeSavedVersion(versionId, type);

      // Update local state
      if (type === 'audio') {
        set(state => ({
          savedAudioVersions: state.savedAudioVersions.filter(
            v => v.id !== versionId
          ),
        }));
      } else {
        set(state => ({
          savedTextVersions: state.savedTextVersions.filter(
            v => v.id !== versionId
          ),
        }));
      }

      logger.info(`Removed ${type} version from saved list:`, versionId);
    } catch (error) {
      logger.error('Error removing saved version:', error);
      set({ versionsError: 'Failed to remove version from saved list' });
      throw error;
    }
  },

  loadSavedVersions: async () => {
    try {
      set({ isLoadingVersions: true, versionsError: null });

      const savedVersions = await userVersionsService.getSavedVersions();
      set({
        savedAudioVersions: savedVersions.audio,
        savedTextVersions: savedVersions.text,
        isLoadingVersions: false,
      });
    } catch (error) {
      logger.error('Error loading saved versions:', error);
      set({
        isLoadingVersions: false,
        versionsError: 'Failed to load saved versions',
      });
      throw error;
    }
  },

  isVersionSaved: (versionId: string, type: 'audio' | 'text'): boolean => {
    const { savedAudioVersions, savedTextVersions } = get();

    if (type === 'audio') {
      return savedAudioVersions.some(v => v.id === versionId);
    } else {
      return savedTextVersions.some(v => v.id === versionId);
    }
  },

  clearVersionsError: () => {
    set({ versionsError: null });
  },
});
