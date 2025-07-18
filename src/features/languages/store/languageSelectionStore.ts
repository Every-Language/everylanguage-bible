import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LanguageSelectionStore,
  LanguageSelectionState,
  AudioVersion,
  TextVersion,
  LanguageEntity,
  LanguageHierarchyNode,
} from '../types';
import { languageEntitiesService, userVersionsService } from '../services';

// Initial state
const initialState: LanguageSelectionState = {
  // Current active selections (persisted)
  currentAudioVersion: null,
  currentTextVersion: null,

  // User's saved versions
  savedAudioVersions: [],
  savedTextVersions: [],

  // Language browsing state
  languageHierarchy: [],
  currentLanguagePath: [],
  expandedNodes: new Set<string>(),

  // Search and filtering
  searchQuery: '',
  searchResults: [],

  // Available versions for current language selection
  availableAudioVersions: [],
  availableTextVersions: [],

  // UI state
  isLoadingHierarchy: false,
  isLoadingVersions: false,
  isSearching: false,
  error: null,

  // Last sync state
  lastSyncAt: null,
  syncInProgress: false,
};

export const useLanguageSelectionStore = create<LanguageSelectionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Current version management
      setCurrentAudioVersion: (version: AudioVersion | null) => {
        set({ currentAudioVersion: version });

        // Persist to AsyncStorage and cloud
        userVersionsService
          .saveCurrentSelections(version, get().currentTextVersion)
          .catch(error => {
            console.error('Error saving current audio version:', error);
            set({ error: 'Failed to save current audio version' });
          });
      },

      setCurrentTextVersion: (version: TextVersion | null) => {
        set({ currentTextVersion: version });

        // Persist to AsyncStorage and cloud
        userVersionsService
          .saveCurrentSelections(get().currentAudioVersion, version)
          .catch(error => {
            console.error('Error saving current text version:', error);
            set({ error: 'Failed to save current text version' });
          });
      },

      // Saved versions management
      addSavedVersion: async (
        version: AudioVersion | TextVersion,
        type: 'audio' | 'text'
      ) => {
        try {
          const savedVersionInput = {
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
            set({ error: `${version.name} is already in your saved versions` });
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
              error: null,
            }));
          } else {
            set(state => ({
              savedTextVersions: [
                ...state.savedTextVersions,
                version as TextVersion,
              ],
              error: null,
            }));
          }

          console.log(`Added ${type} version to saved list:`, version.name);
        } catch (error) {
          console.error('Error adding saved version:', error);
          set({ error: `Failed to add ${version.name} to saved versions` });
        }
      },

      removeSavedVersion: async (versionId: string, type: 'audio' | 'text') => {
        try {
          await userVersionsService.removeSavedVersion(versionId, type);

          // Update local state
          if (type === 'audio') {
            set(state => ({
              savedAudioVersions: state.savedAudioVersions.filter(
                v => v.id !== versionId
              ),
              error: null,
            }));
          } else {
            set(state => ({
              savedTextVersions: state.savedTextVersions.filter(
                v => v.id !== versionId
              ),
              error: null,
            }));
          }

          console.log(`Removed ${type} version from saved list:`, versionId);
        } catch (error) {
          console.error('Error removing saved version:', error);
          set({ error: `Failed to remove version from saved list` });
        }
      },

      loadSavedVersions: async () => {
        try {
          const savedVersions = await userVersionsService.getSavedVersions();
          set({
            savedAudioVersions: savedVersions.audio,
            savedTextVersions: savedVersions.text,
            error: null,
          });
        } catch (error) {
          console.error('Error loading saved versions:', error);
          set({ error: 'Failed to load saved versions' });
        }
      },

      // Language hierarchy navigation
      loadLanguageHierarchy: async () => {
        try {
          set({ isLoadingHierarchy: true, error: null });

          const hierarchy =
            await languageEntitiesService.fetchLanguageHierarchy();

          // Convert to hierarchy nodes
          const hierarchyNodes = buildHierarchyNodes(hierarchy);

          set({
            languageHierarchy: hierarchyNodes,
            isLoadingHierarchy: false,
            error: null,
          });
        } catch (error) {
          console.error('Error loading language hierarchy:', error);
          set({
            isLoadingHierarchy: false,
            error: 'Failed to load language hierarchy',
          });
        }
      },

      expandLanguageNode: (nodeId: string) => {
        set(state => {
          const newExpandedNodes = new Set(state.expandedNodes);
          newExpandedNodes.add(nodeId);
          return { expandedNodes: newExpandedNodes };
        });
      },

      collapseLanguageNode: (nodeId: string) => {
        set(state => {
          const newExpandedNodes = new Set(state.expandedNodes);
          newExpandedNodes.delete(nodeId);
          return { expandedNodes: newExpandedNodes };
        });
      },

      navigateToLanguage: (language: LanguageEntity) => {
        languageEntitiesService
          .getLanguagePath(language.id)
          .then(path => {
            set({ currentLanguagePath: path });
          })
          .catch(error => {
            console.error('Error getting language path:', error);
            set({ error: 'Failed to navigate to language' });
          });
      },

      navigateBack: () => {
        set(state => {
          const newPath = [...state.currentLanguagePath];
          newPath.pop();
          return { currentLanguagePath: newPath };
        });
      },

      resetNavigation: () => {
        set({ currentLanguagePath: [], expandedNodes: new Set() });
      },

      // Search functionality
      searchLanguages: async (query: string) => {
        try {
          set({ isSearching: true, searchQuery: query, error: null });

          if (!query.trim()) {
            set({ searchResults: [], isSearching: false });
            return;
          }

          const results = await languageEntitiesService.searchLanguages(query);

          set({
            searchResults: results,
            isSearching: false,
            error: null,
          });
        } catch (error) {
          console.error('Error searching languages:', error);
          set({
            isSearching: false,
            error: 'Failed to search languages',
          });
        }
      },

      clearSearch: () => {
        set({
          searchQuery: '',
          searchResults: [],
          isSearching: false,
        });
      },

      // Version loading
      loadAvailableVersions: async (languageEntityId: string) => {
        try {
          set({ isLoadingVersions: true, error: null });

          const versions =
            await languageEntitiesService.getAvailableVersions(
              languageEntityId
            );

          set({
            availableAudioVersions: versions.audio,
            availableTextVersions: versions.text,
            isLoadingVersions: false,
            error: null,
          });
        } catch (error) {
          console.error('Error loading available versions:', error);
          set({
            isLoadingVersions: false,
            error: 'Failed to load available versions',
          });
        }
      },

      // Sync and persistence
      syncWithCloud: async () => {
        try {
          set({ syncInProgress: true, error: null });

          // Sync language entities
          await languageEntitiesService.syncLanguageEntities();

          // Sync saved versions
          await userVersionsService.syncSavedVersions();

          // Reload saved versions from local storage
          await get().loadSavedVersions();

          set({
            syncInProgress: false,
            lastSyncAt: new Date().toISOString(),
            error: null,
          });

          console.log('Successfully synced with cloud');
        } catch (error) {
          console.error('Error syncing with cloud:', error);
          set({
            syncInProgress: false,
            error: 'Failed to sync with cloud',
          });
        }
      },

      persistCurrentSelections: async () => {
        try {
          const { currentAudioVersion, currentTextVersion } = get();
          await userVersionsService.saveCurrentSelections(
            currentAudioVersion,
            currentTextVersion
          );
        } catch (error) {
          console.error('Error persisting current selections:', error);
          set({ error: 'Failed to save current selections' });
        }
      },

      restoreCurrentSelections: async () => {
        try {
          const selections = await userVersionsService.getCurrentSelections();
          set({
            currentAudioVersion: selections.audio,
            currentTextVersion: selections.text,
            error: null,
          });
        } catch (error) {
          console.error('Error restoring current selections:', error);
          set({ error: 'Failed to restore current selections' });
        }
      },

      // Error handling
      clearError: () => {
        set({ error: null });
      },

      setError: (error: string) => {
        set({ error });
      },
    }),
    {
      name: 'language-selection-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist current selections and UI state
      partialize: state => ({
        currentAudioVersion: state.currentAudioVersion,
        currentTextVersion: state.currentTextVersion,
        expandedNodes: Array.from(state.expandedNodes || new Set()), // Safely convert Set to Array
        searchQuery: state.searchQuery,
      }),
      // Ensure proper state restoration
      onRehydrateStorage: () => state => {
        if (state && Array.isArray(state.expandedNodes)) {
          state.expandedNodes = new Set(state.expandedNodes);
        } else if (state && !state.expandedNodes) {
          state.expandedNodes = new Set();
        }
      },
    }
  )
);

// Helper function to build hierarchy nodes with depth information
function buildHierarchyNodes(
  entities: LanguageEntity[],
  depth = 0,
  parentPath: string[] = []
): LanguageHierarchyNode[] {
  return entities.map(entity => {
    const node: LanguageHierarchyNode = {
      ...entity,
      depth,
      path: [...parentPath, entity.id],
      children: entity.children
        ? buildHierarchyNodes(entity.children, depth + 1, [
            ...parentPath,
            entity.id,
          ])
        : [],
    };
    return node;
  });
}

// Initialize store on app start
export const initializeLanguageSelectionStore = async () => {
  const store = useLanguageSelectionStore.getState();

  try {
    // Restore current selections
    await store.restoreCurrentSelections();

    // Load saved versions
    await store.loadSavedVersions();

    // Load language hierarchy if not already loaded
    if (store.languageHierarchy.length === 0) {
      await store.loadLanguageHierarchy();
    }

    console.log('Language selection store initialized successfully');
  } catch (error) {
    console.error('Error initializing language selection store:', error);
    store.setError('Failed to initialize language selection');
  }
};

// Export the store
export default useLanguageSelectionStore;
