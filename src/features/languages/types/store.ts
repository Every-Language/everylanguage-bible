import type {
  LanguageEntity,
  LanguageHierarchyNode,
  AudioVersion,
  TextVersion,
} from './entities';

// Store State Types
export interface LanguageSelectionState {
  // Current active selections (persisted)
  currentAudioVersion: AudioVersion | null;
  currentTextVersion: TextVersion | null;

  // User's saved versions
  savedAudioVersions: AudioVersion[];
  savedTextVersions: TextVersion[];

  // Language browsing state
  languageHierarchy: LanguageHierarchyNode[];
  currentLanguagePath: LanguageEntity[]; // Breadcrumb trail
  expandedNodes: Set<string>; // Track which nodes are expanded

  // Search and filtering
  searchQuery: string;
  searchResults: LanguageEntity[];

  // Available versions for current language selection
  availableAudioVersions: AudioVersion[];
  availableTextVersions: TextVersion[];

  // UI state
  isLoadingHierarchy: boolean;
  isLoadingVersions: boolean;
  isSearching: boolean;
  error: string | null;

  // Last sync state
  lastSyncAt: string | null;
  syncInProgress: boolean;
}

// Store Actions
export interface LanguageSelectionActions {
  // Current version management
  setCurrentAudioVersion: (version: AudioVersion | null) => void;
  setCurrentTextVersion: (version: TextVersion | null) => void;

  // Saved versions management
  addSavedVersion: (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => Promise<void>;
  removeSavedVersion: (
    versionId: string,
    type: 'audio' | 'text'
  ) => Promise<void>;
  loadSavedVersions: () => Promise<void>;

  // Language hierarchy navigation
  loadLanguageHierarchy: () => Promise<void>;
  expandLanguageNode: (nodeId: string) => void;
  collapseLanguageNode: (nodeId: string) => void;
  navigateToLanguage: (language: LanguageEntity) => void;
  navigateBack: () => void;
  resetNavigation: () => void;

  // Search functionality
  searchLanguages: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Version loading
  loadAvailableVersions: (languageEntityId: string) => Promise<void>;

  // Sync and persistence
  syncWithCloud: () => Promise<void>;
  persistCurrentSelections: () => Promise<void>;
  restoreCurrentSelections: () => Promise<void>;

  // Error handling
  clearError: () => void;
  setError: (error: string) => void;
}

// Combined store type
export type LanguageSelectionStore = LanguageSelectionState &
  LanguageSelectionActions;

// Hook Return Types
export interface UseLanguageSelectionReturn {
  state: LanguageSelectionState;
  selectAudioVersion: (version: AudioVersion) => void;
  selectTextVersion: (version: TextVersion) => void;
  addToSavedVersions: (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => Promise<void>;
  removeFromSavedVersions: (
    versionId: string,
    type: 'audio' | 'text'
  ) => Promise<void>;
  navigateToLanguage: (language: LanguageEntity) => void;
  searchLanguages: (query: string) => void;
  loadLanguageHierarchy: () => Promise<void>;
  loadAvailableVersions: (languageId: string) => Promise<void>;
  syncWithCloud: () => Promise<void>;
}

export interface UseCurrentVersionsReturn {
  currentAudioVersion: AudioVersion | null;
  currentTextVersion: TextVersion | null;
  isLoading: boolean;
  error: string | null;
  setAudioVersion: (version: AudioVersion | null) => void;
  setTextVersion: (version: TextVersion | null) => void;
}

export interface UseSavedVersionsReturn {
  savedAudioVersions: AudioVersion[];
  savedTextVersions: TextVersion[];
  isLoading: boolean;
  error: string | null;
  addVersion: (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => Promise<void>;
  removeVersion: (versionId: string, type: 'audio' | 'text') => Promise<void>;
  isVersionSaved: (versionId: string, type: 'audio' | 'text') => boolean;
  refresh: () => Promise<void>;
}
