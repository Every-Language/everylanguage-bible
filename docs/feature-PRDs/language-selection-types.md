# Language Selection Feature - TypeScript Types Reference

This document provides the TypeScript type definitions needed for implementing the language selection feature. These types should be implemented in `src/features/languages/types/`.

## Core Types

### Language Entity Types

```typescript
// Based on the language_entities table structure
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
```

### Version Types

```typescript
// Audio version (from projects with bible audio)
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

// Text version (from projects or text_versions)
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
```

### User Saved Versions

```typescript
// Saved version in user's personal list
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
```

## Store State Types

### Main Store State

```typescript
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
```

### Store Actions

```typescript
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
```

## Component Props Types

### Language Hierarchy Browser

```typescript
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
```

### Version Selection Modal

```typescript
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
```

### Version Selector Buttons

```typescript
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
```

### Available Versions List

```typescript
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
```

## Service Types

### Language Entities Service

```typescript
export interface LanguageEntitiesServiceInterface {
  // Fetch the complete language hierarchy
  fetchLanguageHierarchy(): Promise<LanguageEntity[]>;

  // Get direct children of a language entity
  getChildLanguages(parentId: string): Promise<LanguageEntity[]>;

  // Search languages by name (fuzzy search)
  searchLanguages(query: string): Promise<LanguageEntity[]>;

  // Get language path from root to specific language
  getLanguagePath(languageId: string): Promise<LanguageEntity[]>;

  // Get available versions for a language
  getAvailableVersions(languageEntityId: string): Promise<{
    audio: AudioVersion[];
    text: TextVersion[];
  }>;

  // Cache management
  syncLanguageEntities(): Promise<void>;
  clearLanguageCache(): Promise<void>;
}
```

### User Versions Service

```typescript
export interface UserVersionsServiceInterface {
  // Get all saved versions for the user
  getSavedVersions(): Promise<{
    audio: AudioVersion[];
    text: TextVersion[];
  }>;

  // Add a version to saved list
  addSavedVersion(input: SavedVersionInput): Promise<void>;

  // Remove a version from saved list
  removeSavedVersion(
    versionId: string,
    versionType: 'audio' | 'text'
  ): Promise<void>;

  // Check if a version is already saved
  isVersionSaved(
    versionId: string,
    versionType: 'audio' | 'text'
  ): Promise<boolean>;

  // Sync saved versions with cloud (for authenticated users)
  syncSavedVersions(): Promise<void>;

  // Get current active selections
  getCurrentSelections(): Promise<{
    audio: AudioVersion | null;
    text: TextVersion | null;
  }>;

  // Save current selections
  saveCurrentSelections(
    audio: AudioVersion | null,
    text: TextVersion | null
  ): Promise<void>;
}
```

## Hook Return Types

### useLanguageSelection Hook

```typescript
export interface UseLanguageSelectionReturn {
  // Current state
  state: LanguageSelectionState;

  // Selection actions
  selectAudioVersion: (version: AudioVersion) => void;
  selectTextVersion: (version: TextVersion) => void;

  // Saved versions actions
  addToSavedVersions: (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => Promise<void>;
  removeFromSavedVersions: (
    versionId: string,
    type: 'audio' | 'text'
  ) => Promise<void>;

  // Navigation actions
  navigateToLanguage: (language: LanguageEntity) => void;
  searchLanguages: (query: string) => void;

  // Loading actions
  loadLanguageHierarchy: () => Promise<void>;
  loadAvailableVersions: (languageId: string) => Promise<void>;

  // Sync actions
  syncWithCloud: () => Promise<void>;
}
```

### useCurrentVersions Hook

```typescript
export interface UseCurrentVersionsReturn {
  currentAudioVersion: AudioVersion | null;
  currentTextVersion: TextVersion | null;
  isLoading: boolean;
  error: string | null;

  setAudioVersion: (version: AudioVersion | null) => void;
  setTextVersion: (version: TextVersion | null) => void;
}
```

### useSavedVersions Hook

```typescript
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
```

## Storage Types

### AsyncStorage Keys

```typescript
export const STORAGE_KEYS = {
  CURRENT_AUDIO_VERSION: '@language_selection/current_audio_version',
  CURRENT_TEXT_VERSION: '@language_selection/current_text_version',
  LAST_LANGUAGE_SEARCH: '@language_selection/last_search',
  EXPANDED_NODES: '@language_selection/expanded_nodes',
  LANGUAGE_CACHE_TIMESTAMP: '@language_selection/cache_timestamp',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
```

### Persistence Types

```typescript
// For storing current selections in AsyncStorage
export interface StoredCurrentSelections {
  audioVersion: AudioVersion | null;
  textVersion: TextVersion | null;
  timestamp: string;
}

// For caching search results
export interface StoredSearchResults {
  query: string;
  results: LanguageEntity[];
  timestamp: string;
  expiresAt: string;
}

// For storing UI state
export interface StoredUIState {
  expandedNodes: string[];
  lastSearchQuery: string;
  timestamp: string;
}
```

## Error Types

```typescript
export interface LanguageSelectionError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export type LanguageSelectionErrorCode =
  | 'NETWORK_ERROR'
  | 'STORAGE_ERROR'
  | 'SYNC_ERROR'
  | 'VALIDATION_ERROR'
  | 'LANGUAGE_NOT_FOUND'
  | 'VERSION_NOT_FOUND'
  | 'PERMISSION_DENIED';
```

## Usage Examples

### Store Usage

```typescript
// In a component
const useLanguageSelectionStore = create<LanguageSelectionStore>()(
  (set, get) => ({
    // Initial state
    currentAudioVersion: null,
    currentTextVersion: null,
    savedAudioVersions: [],
    savedTextVersions: [],
    // ... other state

    // Actions
    setCurrentAudioVersion: version => {
      set({ currentAudioVersion: version });
      // Persist to AsyncStorage
    },

    addSavedVersion: async (version, type) => {
      // Implementation
    },

    // ... other actions
  })
);
```

### Component Usage

```typescript
// In a React component
const MyComponent: React.FC = () => {
  const {
    currentAudioVersion,
    currentTextVersion,
    savedAudioVersions,
    selectAudioVersion,
    addToSavedVersions
  } = useLanguageSelection();

  const handleVersionSelect = (version: AudioVersion) => {
    selectAudioVersion(version);
  };

  return (
    <AudioVersionSelector
      currentVersion={currentAudioVersion}
      onPress={() => setModalVisible(true)}
    />
  );
};
```
