# Language & Version Selection System

A production-ready language and version selection system built for React Native with PowerSync, optimized for slow networks and offline-first functionality.

## 🏗️ Architecture Overview

The system has been completely rewritten to use PowerSync's real-time capabilities and follows these principles:

- **Real-time reactivity**: Uses PowerSync's `watch` API for instant UI updates
- **Offline-first**: All data is synced locally via PowerSync for instant access
- **Debounced search**: Optimized for slow networks with intelligent caching
- **Type-safe**: Full TypeScript support with proper type definitions
- **Production-ready**: Handles edge cases, loading states, and error conditions

## 🔧 Core Components

### Services

- **`UserVersionsService`** - Manages saved versions and current selections using PowerSync
- **`LanguageSearchService`** - Handles debounced language search with caching
- **`FuzzySearchService`** - Server-side fuzzy search API integration

### Hooks

- **`useUserVersions`** - Real-time user versions and selections with PowerSync watchers
- **`useLanguageSearch`** - Debounced language search with proper cleanup

### Components

- **`VersionSelectionModal`** - Main version selection interface
- **`LanguageSearchModal`** - Search interface with debouncing
- **`VersionSelectionFromLanguageModal`** - Version selection from specific language

## 📱 User Flow

### Audio/Text Version Selection

1. **User opens version selection modal** → Shows saved versions for that type
2. **Select from saved** → Immediately sets as current version
3. **Add new version** → Opens language search
4. **Search language** → Debounced search with available/unavailable results
5. **Select language** → Shows available versions for that language
6. **Select version** → Adds to saved versions AND sets as current

### Key Features

- ✅ Real-time updates when versions are added/removed
- ✅ Debounced search (500ms) to reduce network calls
- ✅ Cached search results for better performance
- ✅ Already saved versions are greyed out and non-selectable
- ✅ Duplicate prevention
- ✅ Proper loading and error states
- ✅ Works with both anonymous and authenticated users

## 🚀 Usage

### Basic Version Selection

```tsx
import { VersionSelectionModal } from '@/features/languages';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <VersionSelectionModal
      visible={showModal}
      onClose={() => setShowModal(false)}
      versionType='audio' // or "text"
      title='Select Audio Version'
    />
  );
}
```

### Using the Hooks

```tsx
import { useUserVersions } from '@/features/languages';

function MyComponent() {
  const {
    savedAudioVersions,
    currentAudioVersion,
    setCurrentAudioVersion,
    isLoading,
    error,
  } = useUserVersions();

  // Real-time updates when data changes!
  return (
    <div>
      <p>Current: {currentAudioVersion?.name}</p>
      <p>Saved: {savedAudioVersions.length}</p>
    </div>
  );
}
```

### Language Search

```tsx
import { useLanguageSearch } from '@/features/languages';

function SearchComponent() {
  const {
    isSearching,
    availableResults,
    unavailableResults,
    searchAudioVersions,
    clearResults,
  } = useLanguageSearch();

  const handleSearch = (query: string) => {
    // Returns cleanup function - debouncing handled internally
    return searchAudioVersions(query);
  };

  return (
    <div>
      {isSearching && <p>Searching...</p>}
      {availableResults.map(result => (
        <div key={result.entity_id}>{result.entity_name}</div>
      ))}
    </div>
  );
}
```

## 🗄️ Database Schema

The system uses PowerSync tables that sync with your backend:

```typescript
// User's saved versions
user_saved_audio_versions: {
  id: string;
  user_id: string;
  audio_version_id: string;
  created_at: string;
  updated_at: string;
}

user_saved_text_versions: {
  id: string;
  user_id: string;
  text_version_id: string;
  created_at: string;
  updated_at: string;
}

// Current selections (max 1 per user)
user_current_selections: {
  id: string;
  user_id: string;
  selected_audio_version: string | null;
  selected_text_version: string | null;
  created_at: string;
  updated_at: string;
}
```

## ⚡ Performance Optimizations

1. **Debounced Search**: 500ms debounce prevents excessive API calls
2. **Search Caching**: Results cached to avoid duplicate requests
3. **PowerSync Watchers**: Real-time updates without manual polling
4. **Optimistic UI**: Immediate feedback for user actions
5. **Incremental Loading**: Only load data when needed

## 🔧 Configuration

### Search Debouncing

```typescript
// Default: 500ms (configurable per search)
const cleanup = searchAudioVersions(query, 300); // Custom 300ms debounce
```

### Prefetch Common Searches

```typescript
import { languageSearchService } from '@/features/languages';

// Prefetch popular languages for better UX
await languageSearchService.prefetchCommonSearches([
  'english',
  'spanish',
  'french',
  'mandarin',
]);
```

## 🛠️ Development

### Adding New Version Types

1. Update the schema in `AppSchema.ts`
2. Add new tables to `UserVersionsService`
3. Update type definitions in `types/entities.ts`
4. Extend hooks and components

### Testing

The system is designed for easy testing:

```typescript
// Mock the services
jest.mock('@/features/languages/services/userVersionsService');
jest.mock('@/features/languages/services/languageSearchService');
```

## 🚨 Migration Guide

If you were using the old system:

### Old → New Hook Migration

```typescript
// OLD
import { usePowerSyncUserVersions } from '@/features/languages';

// NEW
import { useUserVersions } from '@/features/languages';
```

### Old → New Component Migration

```typescript
// OLD
import { NewVersionSelectionModal } from '@/features/languages';

// NEW
import { VersionSelectionModal } from '@/features/languages';
```

### Breaking Changes

- Removed `useFuzzySearch` → Use `useLanguageSearch`
- Removed `usePowerSyncUserVersions` → Use `useUserVersions`
- Removed `NewVersionSelectionModal` → Use `VersionSelectionModal`
- Search now requires minimum 2 characters (was 1)
- All operations now require authenticated/anonymous user session

## 📋 Requirements

- PowerSync configured and connected
- Supabase auth (anonymous or authenticated)
- React Native with TypeScript
- Network connectivity for search (cached for offline)

## 🐛 Troubleshooting

### "No saved versions" showing

1. Check PowerSync connection: `powerSyncSystem.isConnected`
2. Verify user authentication: `supabase.auth.getSession()`
3. Check PowerSync sync status: `powerSyncSystem.currentStatus`

### Search not working

1. Verify network connectivity
2. Check minimum query length (2 characters)
3. Verify Supabase function permissions

### Real-time updates not working

1. Ensure PowerSync watchers are active
2. Check if PowerSync is properly syncing
3. Verify table permissions in sync rules

## 📚 API Reference

See individual service and hook files for detailed API documentation.

## 🤝 Contributing

When contributing:

1. Follow TypeScript strict mode
2. Add proper error handling
3. Include loading states
4. Test with slow networks
5. Ensure offline functionality
6. Add JSDoc comments for public APIs
