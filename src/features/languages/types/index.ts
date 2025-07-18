// Core Language Entity Types
export interface LanguageEntity {
  id: string;
  name: string;
  level: 'family' | 'language' | 'dialect' | 'mother_tongue';
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Computed fields for UI
  children?: LanguageEntity[];
  isExpanded?: boolean;
  hasChildren?: boolean;
}

// For hierarchical display
export interface LanguageHierarchyNode extends LanguageEntity {
  depth: number;
  path: string[]; // Array of parent IDs from root to current
  children: LanguageHierarchyNode[];
}

// Version Types
export interface AudioVersion {
  id: string; // project_id
  name: string; // project.name
  languageEntityId: string; // project.target_language_entity_id
  languageName: string; // resolved from language_entity
  mediaFileCount: number; // count of associated media files
  totalDuration?: number; // sum of all media file durations
  createdAt: string;
  updatedAt: string;
}

export interface TextVersion {
  id: string; // project_id or text_version_id
  name: string; // project.name or text_version.name
  languageEntityId: string;
  languageName: string;
  source: 'project' | 'text_version'; // indicates which table this came from
  verseCount: number; // count of associated verse_texts
  createdAt: string;
  updatedAt: string;
}

// Union type for when we need to handle both
export type BibleVersion = AudioVersion | TextVersion;

// User Saved Versions
export interface UserSavedVersion {
  id: string;
  versionType: 'audio' | 'text';
  languageEntityId: string;
  languageName: string;
  versionId: string; // References AudioVersion.id or TextVersion.id
  versionName: string;
  createdAt: string;
  updatedAt: string;
  syncedAt: string;
}

// Input for adding a new saved version
export interface SavedVersionInput {
  versionType: 'audio' | 'text';
  languageEntityId: string;
  languageName: string;
  versionId: string;
  versionName: string;
}

// Service Interface Types
export interface LanguageEntitiesServiceInterface {
  fetchLanguageHierarchy(): Promise<LanguageEntity[]>;
  getChildLanguages(parentId: string): Promise<LanguageEntity[]>;
  searchLanguages(query: string): Promise<LanguageEntity[]>;
  getLanguagePath(languageId: string): Promise<LanguageEntity[]>;
  getAvailableVersions(languageEntityId: string): Promise<{
    audio: AudioVersion[];
    text: TextVersion[];
  }>;
  syncLanguageEntities(): Promise<void>;
  clearLanguageCache(): Promise<void>;
}

export interface UserVersionsServiceInterface {
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
  syncSavedVersions(): Promise<void>;
  getCurrentSelections(): Promise<{
    audio: AudioVersion | null;
    text: TextVersion | null;
  }>;
  saveCurrentSelections(
    audio: AudioVersion | null,
    text: TextVersion | null
  ): Promise<void>;
}

// Storage Types
export const STORAGE_KEYS = {
  CURRENT_AUDIO_VERSION: '@language_selection/current_audio_version',
  CURRENT_TEXT_VERSION: '@language_selection/current_text_version',
  LAST_LANGUAGE_SEARCH: '@language_selection/last_search',
  EXPANDED_NODES: '@language_selection/expanded_nodes',
  LANGUAGE_CACHE_TIMESTAMP: '@language_selection/cache_timestamp',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// For storing current selections in AsyncStorage
export interface StoredCurrentSelections {
  audioVersion: AudioVersion | null;
  textVersion: TextVersion | null;
  timestamp: string;
}

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

// Component Props Types

// Version Selector Buttons
export interface AudioVersionSelectorProps {
  currentVersion: AudioVersion | null;
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'full';
}

export interface TextVersionSelectorProps {
  currentVersion: TextVersion | null;
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'full';
}

// Language Hierarchy Browser
export interface LanguageHierarchyBrowserProps {
  visible: boolean;
  onClose: () => void;
  onLanguageSelect: (language: LanguageEntity) => void;
  onVersionSelect?: (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => void;
  mode: 'browse' | 'select'; // browse for exploration, select for choosing
  title?: string;
}

export interface LanguageNodeProps {
  node: LanguageHierarchyNode;
  isExpanded: boolean;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (language: LanguageEntity) => void;
  depth: number;
}

// Version Selection Modal
export interface VersionSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onVersionSelect: (version: AudioVersion | TextVersion) => void;
  versionType: 'audio' | 'text';
  currentVersion?: AudioVersion | TextVersion | null;
  savedVersions: (AudioVersion | TextVersion)[];
  title: string;
}

export interface VersionListItemProps {
  version: AudioVersion | TextVersion;
  isSelected: boolean;
  onSelect: (version: AudioVersion | TextVersion) => void;
  onRemove?: (versionId: string) => void;
  showRemoveButton?: boolean;
}

// Available Versions List
export interface AvailableVersionsListProps {
  language: LanguageEntity;
  audioVersions: AudioVersion[];
  textVersions: TextVersion[];
  onAddVersion: (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => void;
  isLoading: boolean;
  error?: string | null;
}

export interface VersionCategoryProps {
  title: string;
  versions: (AudioVersion | TextVersion)[];
  versionType: 'audio' | 'text';
  onAddVersion: (version: AudioVersion | TextVersion) => void;
  emptyMessage: string;
}
