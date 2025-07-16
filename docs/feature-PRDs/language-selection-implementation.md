# Language Selection Feature Implementation Tasks

help me implement the next feature in my react native app - language selection to allow the user to save versions, and then select a language for the audio and text (independently)

all of my types are here and are automatically installed as an npm package

in my types, i have language_entities, which are the languages we will be selecting from
This table is a self relating hierarchy so you can organise itself in hierarchy trees
For this feature I want you to help me design an easy to use UI which allows the user to expand the hierarchy tree until they find their language. They don't necessarily have to select a language which is at the lowest level. They might select one which is halfway up or even at the Parent level. once they pick a language they can see the available versions for that language, and then select a version to add to their versions

each language has audio versions and text versions
an audio version is: a project which has at least one media_files with is_bible_audio = true AND publish_status = publish
a text version is: EITHER (1) a project which has at least one verse_texts with publish_status = publish OR (2) a text_version which has at least one verse_texts with publish_status = publish
each version should have its displayed name (either the text_versions name or the projects name)

We should have global stores/contexts, one for the currently selected audio version and one for the currently selected text language. They should persist between sessions.
We should also cache the users saved versions in the database.

UI flow:
So that UI flow should look something like this – there will be buttons in various places to change either the audio version or the text version – these are independent of each other. Let's say I click a button to change the audio version. This should bring up the modal with the current audio version, and underneath that list of the users saved versions to select. The user can search through a list of saved versions languages select one and then press the select button to change the selected audio language. The version selection for text should be behave similarly. Anywhere the list of the users save versions are displayed, button should also be displayed to add a version to the users list of saved versions clicking this button should open the language selection model, which has that hierarchical UI which I was describing before. A user can then select a language, then select one of that language's versions and add it to the list of their languages.

## Overview

This document outlines the complete implementation tasks for the language selection feature, allowing users to:

1. Browse hierarchical language entities and select languages
2. Choose audio and text versions independently
3. Save versions to a personal list with local and cloud persistence
4. Switch between saved audio/text versions via modal interfaces

## Feature Requirements Summary

- **Language Selection**: Hierarchical tree browsing of `language_entities` table
- **Version Management**: Audio versions (projects with `is_bible_audio=true` media files) and text versions (projects/text_versions with published verse_texts)
- **Independent Selection**: Separate audio and text version selection
- **Persistence**: Local database storage + AsyncStorage for current selections
- **UI Flow**: Modal-based selection with search and version management

## Database Schema Requirements

### Required Tables (Add to existing schema)

```sql
-- User saved language versions (local storage)
CREATE TABLE IF NOT EXISTS user_saved_versions (
  id TEXT PRIMARY KEY,
  version_type TEXT NOT NULL CHECK (version_type IN ('audio', 'text')),
  language_entity_id TEXT NOT NULL,
  language_name TEXT NOT NULL,
  version_id TEXT NOT NULL,          -- project_id or text_version_id
  version_name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(version_type, version_id)
);

-- Cache for language entities (for offline access)
CREATE TABLE IF NOT EXISTS language_entities_cache (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,              -- 'family', 'language', 'dialect', 'mother_tongue'
  parent_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES language_entities_cache (id)
);

-- Cache for available versions (audio/text)
CREATE TABLE IF NOT EXISTS available_versions_cache (
  id TEXT PRIMARY KEY,
  version_type TEXT NOT NULL CHECK (version_type IN ('audio', 'text')),
  language_entity_id TEXT NOT NULL,
  version_id TEXT NOT NULL,          -- project_id or text_version_id
  version_name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (language_entity_id) REFERENCES language_entities_cache (id)
);
```

## Task Breakdown

### Phase 1: Database Schema & Services (Priority: High)

#### Task 1.1: Update Database Schema

**Assignee**: Database Team  
**Estimated Time**: 2 hours  
**Dependencies**: None

- [ ] Add new tables to `src/shared/services/database/schema.ts`
- [ ] Update `createTables` function with new table definitions
- [ ] Add proper indexes for performance:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_user_saved_versions_type ON user_saved_versions(version_type);
  CREATE INDEX IF NOT EXISTS idx_language_entities_cache_parent ON language_entities_cache(parent_id);
  CREATE INDEX IF NOT EXISTS idx_available_versions_cache_language ON available_versions_cache(language_entity_id);
  ```
- [ ] Test database migration on development environment

#### Task 1.2: Create Language Entities Service

**Assignee**: Backend Services Team  
**Estimated Time**: 4 hours  
**Dependencies**: Task 1.1

- [ ] Create `src/features/languages/services/languageEntitiesService.ts`
- [ ] Implement methods:
  ```typescript
  interface LanguageEntitiesService {
    // Fetch hierarchical language entities from Supabase
    fetchLanguageHierarchy(): Promise<LanguageEntity[]>;

    // Get children of a specific language entity
    getChildLanguages(parentId: string): Promise<LanguageEntity[]>;

    // Search languages by name
    searchLanguages(query: string): Promise<LanguageEntity[]>;

    // Get available versions for a language
    getAvailableVersions(languageEntityId: string): Promise<{
      audio: AudioVersion[];
      text: TextVersion[];
    }>;
  }
  ```
- [ ] Add proper error handling and offline support
- [ ] Cache language entities locally for offline access

#### Task 1.3: Create User Versions Service

**Assignee**: Backend Services Team  
**Estimated Time**: 3 hours  
**Dependencies**: Task 1.1

- [ ] Create `src/features/languages/services/userVersionsService.ts`
- [ ] Implement methods:
  ```typescript
  interface UserVersionsService {
    // Get user's saved versions
    getSavedVersions(): Promise<UserSavedVersion[]>;

    // Add version to user's list
    addSavedVersion(version: SavedVersionInput): Promise<void>;

    // Remove version from user's list
    removeSavedVersion(
      versionId: string,
      versionType: 'audio' | 'text'
    ): Promise<void>;

    // Sync with cloud (for authenticated users)
    syncSavedVersions(): Promise<void>;
  }
  ```
- [ ] Integrate with local SQLite storage
- [ ] Add cloud sync for authenticated users

### Phase 2: State Management (Priority: High)

#### Task 2.1: Create Language Selection Store

**Assignee**: Frontend State Team  
**Estimated Time**: 3 hours  
**Dependencies**: Task 1.2, 1.3

- [ ] Create `src/features/languages/store/languageSelectionStore.ts` using Zustand
- [ ] Implement store structure:
  ```typescript
  interface LanguageSelectionState {
    // Current selections (persisted)
    currentAudioVersion: AudioVersion | null;
    currentTextVersion: TextVersion | null;

    // Saved versions lists
    savedAudioVersions: AudioVersion[];
    savedTextVersions: TextVersion[];

    // Language browsing state
    languageHierarchy: LanguageEntity[];
    currentLanguagePath: LanguageEntity[];
    searchQuery: string;
    isLoading: boolean;
    error: string | null;

    // Actions
    setCurrentAudioVersion: (version: AudioVersion) => void;
    setCurrentTextVersion: (version: TextVersion) => void;
    addSavedVersion: (
      version: AudioVersion | TextVersion,
      type: 'audio' | 'text'
    ) => void;
    removeSavedVersion: (versionId: string, type: 'audio' | 'text') => void;
    searchLanguages: (query: string) => void;
    navigateToLanguage: (language: LanguageEntity) => void;
    loadAvailableVersions: (languageId: string) => Promise<void>;
  }
  ```
- [ ] Add persistence middleware for current selections using AsyncStorage
- [ ] Add proper error handling and loading states

#### Task 2.2: Create Selection Context

**Assignee**: Frontend State Team  
**Estimated Time**: 2 hours  
**Dependencies**: Task 2.1

- [ ] Create `src/features/languages/context/LanguageSelectionContext.tsx`
- [ ] Wrap the store in React context for easy access
- [ ] Add initialization logic to load saved versions on app start
- [ ] Export custom hooks: `useLanguageSelection`, `useCurrentVersions`, `useSavedVersions`

### Phase 3: UI Components (Priority: High)

#### Task 3.1: Create Language Hierarchy Browser

**Assignee**: UI Components Team  
**Estimated Time**: 6 hours  
**Dependencies**: Task 2.1

- [ ] Create `src/features/languages/components/LanguageHierarchyBrowser.tsx`
- [ ] Implement hierarchical tree view with:
  - [ ] Expandable/collapsible nodes
  - [ ] Breadcrumb navigation
  - [ ] Search functionality
  - [ ] Loading states and error handling
- [ ] Use existing `SlideUpModal` pattern for consistent UX
- [ ] Add accessibility support (screen readers, focus management)
- [ ] Style according to existing theme system

#### Task 3.2: Create Version Selection Modal

**Assignee**: UI Components Team  
**Estimated Time**: 4 hours  
**Dependencies**: Task 3.1

- [ ] Create `src/features/languages/components/VersionSelectionModal.tsx`
- [ ] Implement modal with:
  - [ ] Current version display at top
  - [ ] List of saved versions below
  - [ ] "Add New Version" button
  - [ ] Search through saved versions
  - [ ] Select/confirm actions
- [ ] Support both audio and text version types
- [ ] Add loading states and error handling

#### Task 3.3: Create Version Selection Buttons

**Assignee**: UI Components Team  
**Estimated Time**: 2 hours  
**Dependencies**: Task 3.2

- [ ] Create `src/features/languages/components/AudioVersionSelector.tsx`
- [ ] Create `src/features/languages/components/TextVersionSelector.tsx`
- [ ] Implement compact button components showing:
  - [ ] Current version name
  - [ ] Language name
  - [ ] Dropdown/tap indicator
- [ ] Add consistent styling with existing Button component
- [ ] Handle loading and error states

#### Task 3.4: Create Available Versions List

**Assignee**: UI Components Team  
**Estimated Time**: 3 hours  
**Dependencies**: Task 3.1

- [ ] Create `src/features/languages/components/AvailableVersionsList.tsx`
- [ ] Display versions available for selected language:
  - [ ] Separate sections for audio and text versions
  - [ ] Version names and metadata
  - [ ] "Add to My Versions" buttons
  - [ ] Loading placeholders
- [ ] Integrate with language hierarchy browser
- [ ] Add search/filter functionality

### Phase 4: Integration & Navigation (Priority: Medium)

#### Task 4.1: Integrate with Existing Screens

**Assignee**: Integration Team  
**Estimated Time**: 4 hours  
**Dependencies**: Task 3.3

- [ ] Add version selectors to appropriate screens:
  - [ ] `TopBar.tsx` - primary location for version switching
  - [ ] `BibleContainerScreen.tsx` - context-aware selection
  - [ ] `MediaPlayerSheet.tsx` - audio version switching
- [ ] Ensure selectors appear consistently across the app
- [ ] Update navigation flows to handle version changes

#### Task 4.2: Update App Provider Chain

**Assignee**: Integration Team  
**Estimated Time**: 1 hour  
**Dependencies**: Task 2.2

- [ ] Add `LanguageSelectionProvider` to `src/app/App.tsx`
- [ ] Ensure proper provider ordering (after ThemeProvider, before feature providers)
- [ ] Test context availability throughout component tree

### Phase 5: Data Sync & Caching (Priority: Medium)

#### Task 5.1: Implement Language Data Sync

**Assignee**: Sync Team  
**Estimated Time**: 4 hours  
**Dependencies**: Task 1.2

- [ ] Create sync service for language entities data
- [ ] Add to background sync system for offline access
- [ ] Implement incremental updates for language hierarchy
- [ ] Add proper error handling and retry logic

#### Task 5.2: Implement Version Data Sync

**Assignee**: Sync Team  
**Estimated Time**: 3 hours  
**Dependencies**: Task 5.1

- [ ] Create sync service for available versions data
- [ ] Query Supabase for audio versions:
  ```sql
  SELECT DISTINCT p.id, p.name, p.target_language_entity_id
  FROM projects p
  INNER JOIN media_files mf ON p.id = mf.project_id
  WHERE mf.is_bible_audio = true
  AND mf.publish_status = 'published'
  ```
- [ ] Query for text versions:

  ```sql
  -- From projects with verse_texts
  SELECT DISTINCT p.id, p.name, p.target_language_entity_id
  FROM projects p
  INNER JOIN verse_texts vt ON p.id = vt.project_id
  WHERE vt.publish_status = 'published'

  UNION

  -- From text_versions with verse_texts
  SELECT DISTINCT tv.id, tv.name, tv.language_entity_id
  FROM text_versions tv
  INNER JOIN verse_texts vt ON tv.id = vt.text_version_id
  WHERE vt.publish_status = 'published'
  ```

- [ ] Cache results locally for offline access

### Phase 6: Persistence & Settings (Priority: Medium)

#### Task 6.1: Implement AsyncStorage Persistence

**Assignee**: Storage Team  
**Estimated Time**: 2 hours  
**Dependencies**: Task 2.1

- [ ] Create persistent storage for current selections:
  ```typescript
  // Storage keys
  const STORAGE_KEYS = {
    CURRENT_AUDIO_VERSION: '@current_audio_version',
    CURRENT_TEXT_VERSION: '@current_text_version',
    LAST_LANGUAGE_SEARCH: '@last_language_search',
  };
  ```
- [ ] Implement load/save functions in store
- [ ] Add initialization logic to restore selections on app start
- [ ] Handle storage errors gracefully

#### Task 6.2: Implement Cloud Sync for Authenticated Users

**Assignee**: Cloud Sync Team  
**Estimated Time**: 4 hours  
**Dependencies**: Task 6.1

- [ ] Create user preferences table in Supabase:
  ```sql
  CREATE TABLE user_language_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    current_audio_version_id text,
    current_text_version_id text,
    saved_versions jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
  ```
- [ ] Implement sync service for authenticated users
- [ ] Handle conflicts between local and cloud preferences
- [ ] Add sync status indicators to UI

### Phase 7: Testing & Polish (Priority: Low)

#### Task 7.1: Unit Tests

**Assignee**: Testing Team  
**Estimated Time**: 6 hours  
**Dependencies**: All previous tasks

- [ ] Test language entities service
- [ ] Test user versions service
- [ ] Test Zustand store actions and state updates
- [ ] Test AsyncStorage persistence
- [ ] Test component rendering and interactions
- [ ] Test error scenarios and edge cases

#### Task 7.2: Integration Tests

**Assignee**: Testing Team  
**Estimated Time**: 4 hours  
**Dependencies**: Task 7.1

- [ ] Test complete user flows:
  - [ ] Browse languages → select language → choose version → add to saved versions
  - [ ] Switch between saved audio/text versions
  - [ ] Search functionality across all components
- [ ] Test offline scenarios
- [ ] Test sync scenarios (background sync, manual sync)

#### Task 7.3: Accessibility & Polish

**Assignee**: UI Polish Team  
**Estimated Time**: 3 hours  
**Dependencies**: Task 7.2

- [ ] Add proper accessibility labels and hints
- [ ] Test with screen readers
- [ ] Add haptic feedback for selections
- [ ] Polish animations and transitions
- [ ] Add proper loading indicators
- [ ] Test on various screen sizes and orientations

## File Structure After Implementation

```
src/features/languages/
├── components/
│   ├── AudioVersionSelector.tsx
│   ├── TextVersionSelector.tsx
│   ├── VersionSelectionModal.tsx
│   ├── LanguageHierarchyBrowser.tsx
│   ├── AvailableVersionsList.tsx
│   └── index.ts
├── context/
│   ├── LanguageSelectionContext.tsx
│   └── index.ts
├── hooks/
│   ├── useLanguageSelection.ts
│   ├── useCurrentVersions.ts
│   ├── useSavedVersions.ts
│   └── index.ts
├── services/
│   ├── languageEntitiesService.ts
│   ├── userVersionsService.ts
│   ├── languageSync.ts
│   └── index.ts
├── store/
│   ├── languageSelectionStore.ts
│   └── index.ts
├── types/
│   ├── languageTypes.ts
│   ├── versionTypes.ts
│   └── index.ts
└── index.ts
```

## Integration Points

### With Existing Features

1. **Bible Reading**: Use selected text version for displaying verses
2. **Audio Playback**: Use selected audio version for media files
3. **Sync System**: Integrate language data sync with existing bible sync
4. **Theme System**: Apply consistent theming to all new components
5. **Localization**: Add translation keys for all new UI text

### API Integration

1. **Supabase Queries**: Use existing database types from `@everylanguage/shared-types`
2. **Authentication**: Respect user authentication state for cloud sync
3. **Offline Support**: Leverage existing offline-first architecture
4. **Error Handling**: Use existing error handling patterns

## Success Criteria

- [ ] Users can browse hierarchical language entities
- [ ] Users can select and save audio/text versions independently
- [ ] Selections persist between app sessions
- [ ] Modal UIs are intuitive and accessible
- [ ] Offline functionality works without network
- [ ] Performance is smooth on low-end devices
- [ ] Integration doesn't break existing features
- [ ] Code follows existing architecture patterns

## Risk Mitigation

1. **Performance**: Implement virtual scrolling for large language lists
2. **Memory**: Use lazy loading and cleanup for language data
3. **Network**: Implement proper retry logic and offline handling
4. **Data Consistency**: Add validation for language entity relationships
5. **User Experience**: Provide clear feedback for all loading states

## Dependencies on External Changes

1. **Database Updates**: Some fields mentioned (like `project_id` in media_files) need to be added to Supabase schema
2. **API Enhancements**: May need additional endpoints for efficient version querying
3. **Type Updates**: `@everylanguage/shared-types` package may need updates for new tables

## Implementation Timeline

- **Week 1**: Tasks 1.1-1.3, 2.1-2.2 (Database & State)
- **Week 2**: Tasks 3.1-3.4 (UI Components)
- **Week 3**: Tasks 4.1-4.2, 5.1-5.2 (Integration & Sync)
- **Week 4**: Tasks 6.1-6.2, 7.1-7.3 (Persistence & Testing)

Total estimated time: **45-50 hours** across multiple team members working in parallel.
