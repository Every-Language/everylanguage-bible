# Migration Guide: React Context → Zustand

This document outlines the migration from React Context to Zustand for state management in the EL Bible app.

## Overview

The app has been migrated from React Context to Zustand for better performance, reduced bundle size, and consistent state management patterns.

## Completed Migrations

### Phase 1: Simple Contexts ✅

#### 1. OnboardingContext → useOnboardingStore

- **File**: `src/shared/store/onboardingStore.ts`
- **Hook**: `useOnboarding()` (same API as before)
- **Features**:
  - AsyncStorage persistence
  - Loading states
  - Error handling

#### 2. ThemeContext → useThemeStore

- **File**: `src/shared/store/themeStore.ts`
- **Hook**: `useTheme()` (same API as before)
- **Features**:
  - Theme mode persistence
  - System theme detection
  - AsyncStorage integration

### Phase 2: Medium Complexity ✅

#### 3. LocalizationContext → useLocalizationStore

- **File**: `src/shared/store/localizationStore.ts`
- **Hook**: `useLocalization()` (same API as before)
- **Features**:
  - RTL support
  - Locale switching
  - i18n integration

#### 4. AuthProvider → useAuthStore

- **File**: `src/shared/store/authStore.ts`
- **Hook**: `useAuthContext()` (same API as before)
- **Features**:
  - Supabase integration
  - Session management
  - Authentication state persistence

## Remaining Contexts (Phase 3)

### SyncContext → useSyncStore (TODO)

- **Complexity**: High
- **Features**: Database sync, network connectivity, background sync
- **Estimated Time**: 3-4 days

### MediaPlayerContext → useMediaPlayerStore (TODO)

- **Complexity**: High
- **Features**: Audio playback, queue management, real-time updates
- **Estimated Time**: 3-4 days

## Migration Benefits

### Performance Improvements

- **Reduced Re-renders**: Zustand only re-renders components that subscribe to changed state
- **Smaller Bundle**: Fewer provider components in the component tree
- **Better DevTools**: Enhanced debugging with Zustand devtools

### Developer Experience

- **Consistent API**: All stores follow the same pattern
- **Type Safety**: Full TypeScript support with proper typing
- **Testing**: Easier to mock and test individual stores

### Code Organization

- **Modular**: Each store is self-contained
- **Persistence**: Built-in AsyncStorage integration
- **Error Handling**: Consistent error states across all stores

## Usage Examples

### Before (React Context)

```typescript
import { useTheme } from '@/shared/context/ThemeContext';

const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return <Button onPress={toggleTheme} />;
};
```

### After (Zustand Store)

```typescript
import { useTheme } from '@/shared/hooks';

const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return <Button onPress={toggleTheme} />;
};
```

**Note**: The API remains the same! Components don't need to change.

## Store Structure

Each store follows this pattern:

```typescript
interface StoreState {
  // State properties
  data: any;
  isLoading: boolean;
  error: string | null;
}

interface StoreActions {
  // Actions
  setData: (data: any) => void;
  clearError: () => void;
  // ... other actions
}

type Store = StoreState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state
      data: null,
      isLoading: false,
      error: null,

      // Actions
      setData: data => set({ data, error: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'store-name',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ data: state.data }), // Only persist data
    }
  )
);
```

## Testing

### Store Testing

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useThemeStore } from '@/shared/store/themeStore';

test('should toggle theme', () => {
  const { result } = renderHook(() => useThemeStore());

  act(() => {
    result.current.toggleTheme();
  });

  expect(result.current.mode).toBe('dark');
});
```

### Component Testing

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from './MyComponent';

test('should use theme from store', () => {
  const { getByText } = render(<MyComponent />);
  const button = getByText('Toggle Theme');

  fireEvent.press(button);
  // Component will automatically re-render with new theme
});
```

## Rollback Plan

If issues arise, the old context providers can be restored by:

1. Reverting `src/app/App.tsx` to use context providers
2. Removing the new store files
3. Restoring original hook imports

## Next Steps

1. **Test Phase 1 & 2**: Verify all migrated stores work correctly
2. **Update Components**: Ensure all components use new hooks
3. **Phase 3**: Migrate remaining complex contexts
4. **Performance Testing**: Measure bundle size and performance improvements
5. **Documentation**: Update component documentation

## Files Changed

### New Files

- `src/shared/store/onboardingStore.ts`
- `src/shared/store/themeStore.ts`
- `src/shared/store/localizationStore.ts`
- `src/shared/store/authStore.ts`
- `src/shared/store/index.ts`
- `src/shared/hooks/useThemeFromStore.ts`
- `src/shared/hooks/useLocalizationFromStore.ts`
- `src/shared/hooks/useOnboardingFromStore.ts`
- `src/shared/hooks/useAuthFromStore.ts`
- `src/app/AppWithStores.tsx`

### Modified Files

- `src/shared/hooks/index.ts` - Added new hook exports

### Files to Remove (after Phase 3)

- `src/shared/context/OnboardingContext.tsx`
- `src/shared/context/ThemeContext.tsx`
- `src/shared/context/LocalizationContext.tsx`
- `src/features/auth/components/AuthProvider.tsx`
- `src/features/auth/hooks/useAuth.ts`
