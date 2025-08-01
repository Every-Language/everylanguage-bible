import { StateCreator } from 'zustand';
import { languageService } from '../../services/domain/languageService';
import type {
  LanguageEntity,
  AudioVersion,
  TextVersion,
  LanguageHierarchyNode,
} from '../../types/entities';
import { logger } from '../../../../shared/utils/logger';

// Language Hierarchy Slice State
export interface LanguageHierarchyState {
  // Hierarchy data
  languageHierarchy: LanguageHierarchyNode[];
  currentLanguagePath: LanguageEntity[];
  expandedNodes: Set<string>;

  // Search
  searchQuery: string;
  searchResults: LanguageEntity[];
  isSearching: boolean;

  // Available versions for selected language
  availableAudioVersions: AudioVersion[];
  availableTextVersions: TextVersion[];

  // Loading states
  isLoadingHierarchy: boolean;
  hierarchyError: string | null;
}

// Language Hierarchy Slice Actions
export interface LanguageHierarchyActions {
  // Hierarchy management
  loadLanguageHierarchy: (retryCount?: number) => Promise<void>;
  expandLanguageNode: (nodeId: string) => void;
  collapseLanguageNode: (nodeId: string) => void;
  navigateToLanguage: (language: LanguageEntity) => void;
  navigateBack: () => void;
  resetNavigation: () => void;

  // Search functionality
  searchLanguages: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Available versions
  loadAvailableVersions: (languageEntityId: string) => Promise<void>;

  // Error handling
  clearHierarchyError: () => void;
}

// Combined slice type
export type LanguageHierarchySlice = LanguageHierarchyState &
  LanguageHierarchyActions;

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

// Slice creator function
export const createLanguageHierarchySlice: StateCreator<
  LanguageHierarchySlice,
  [],
  [],
  LanguageHierarchySlice
> = (set, get) => ({
  // Initial state
  languageHierarchy: [],
  currentLanguagePath: [],
  expandedNodes: new Set<string>(),
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  availableAudioVersions: [],
  availableTextVersions: [],
  isLoadingHierarchy: false,
  hierarchyError: null,

  // Actions
  loadLanguageHierarchy: async (retryCount = 0) => {
    const maxRetries = 3; // Increased from 2 to 3

    try {
      set({ isLoadingHierarchy: true, hierarchyError: null });

      // Check if we already have hierarchy in memory
      const currentState = get();
      if (currentState.languageHierarchy.length > 0) {
        // Already loaded, just return
        set({ isLoadingHierarchy: false });

        // Optionally trigger background sync if data is stale
        languageService.syncInBackground().catch((error: unknown) => {
          logger.warn('Background sync failed:', error);
        });

        return;
      }

      // Check if we have any cached data
      const hasCachedData = await languageService.hasCachedLanguageData();

      if (hasCachedData) {
        // Load from cache first (fast)
        const hierarchy = await languageService.getLanguageHierarchyFromCache();

        if (hierarchy.length > 0) {
          // Convert to hierarchy nodes
          const hierarchyNodes = buildHierarchyNodes(hierarchy);

          set({
            languageHierarchy: hierarchyNodes,
            isLoadingHierarchy: false,
            hierarchyError: null,
          });

          // Trigger background sync if needed
          languageService.syncInBackground().catch((error: unknown) => {
            logger.warn('Background sync failed:', error);
          });

          return;
        }
      }

      // No cache available, need to sync first (slower)
      logger.log(
        `No cached language data, performing initial sync... (attempt ${retryCount + 1})`
      );

      // Add a timeout for the sync operation to prevent hanging - increased from 10s to 30s
      const syncPromise = languageService.getLanguageHierarchy();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                'Language sync timeout - please check your internet connection'
              )
            ),
          30000
        );
      });

      const freshHierarchy = await Promise.race([syncPromise, timeoutPromise]);
      const hierarchyNodes = buildHierarchyNodes(freshHierarchy);

      set({
        languageHierarchy: hierarchyNodes,
        isLoadingHierarchy: false,
        hierarchyError: null,
      });

      // Trigger sync in background (non-blocking)
      languageService
        .syncInBackground()
        .then(async () => {
          // After sync completes, reload the hierarchy
          try {
            const freshHierarchy =
              await languageService.getLanguageHierarchyFromCache();
            const hierarchyNodes = buildHierarchyNodes(freshHierarchy);
            set({
              languageHierarchy: hierarchyNodes,
              hierarchyError: null,
            });
            logger.log('Language hierarchy loaded after background sync');
          } catch (error) {
            logger.error('Error loading hierarchy after sync:', error);
            set({
              hierarchyError: 'Failed to load language hierarchy after sync',
            });
          }
        })
        .catch((error: unknown) => {
          logger.error('Background sync failed:', error);

          // Provide more specific error messages
          let errorMessage =
            'Failed to sync language data. Please check your internet connection.';
          if (error instanceof Error) {
            if (error.message.includes('timeout')) {
              errorMessage =
                'Language sync timed out. Please check your internet connection and try again.';
            } else if (
              error.message.includes('network') ||
              error.message.includes('fetch')
            ) {
              errorMessage =
                'Network error during language sync. Please check your internet connection.';
            }
          }

          set({
            hierarchyError: errorMessage,
          });
        });
    } catch (error) {
      logger.error('Error loading language hierarchy:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to load language hierarchy';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage =
            'Language sync timed out. Please check your internet connection and try again.';
        } else if (
          error.message.includes('network') ||
          error.message.includes('fetch')
        ) {
          errorMessage =
            'Network error during language sync. Please check your internet connection.';
        }
      }

      set({
        isLoadingHierarchy: false,
        hierarchyError: errorMessage,
      });

      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        logger.log(
          `Retrying language hierarchy load in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`
        );

        setTimeout(() => {
          get().loadLanguageHierarchy(retryCount + 1);
        }, delay);
      }
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
    languageService
      .getLanguagePath(language.id)
      .then((path: LanguageEntity[]) => {
        set({ currentLanguagePath: path });
      })
      .catch((error: unknown) => {
        logger.error('Error getting language path:', error);
        set({ hierarchyError: 'Failed to navigate to language' });
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

  searchLanguages: async (query: string) => {
    try {
      set({ isSearching: true, searchQuery: query, hierarchyError: null });

      if (!query.trim()) {
        set({ searchResults: [], isSearching: false });
        return;
      }

      const results = await languageService.searchLanguages(query);

      set({
        searchResults: results,
        isSearching: false,
      });
    } catch (error) {
      logger.error('Error searching languages:', error);
      set({
        isSearching: false,
        hierarchyError: 'Failed to search languages',
      });
      throw error;
    }
  },

  clearSearch: () => {
    set({
      searchQuery: '',
      searchResults: [],
      isSearching: false,
    });
  },

  loadAvailableVersions: async (languageEntityId: string) => {
    try {
      set({ hierarchyError: null });

      const versions =
        await languageService.getAvailableVersions(languageEntityId);

      set({
        availableAudioVersions: versions.audio,
        availableTextVersions: versions.text,
      });
    } catch (error) {
      logger.error('Error loading available versions:', error);
      set({
        hierarchyError: 'Failed to load available versions',
      });
      throw error;
    }
  },

  clearHierarchyError: () => {
    set({ hierarchyError: null });
  },
});
