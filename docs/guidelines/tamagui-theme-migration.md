# Tamagui Theme Migration Plan

## Overview

This document outlines the approach to consolidate the Bible App's theme system to use **only Tamagui themes**, eliminating the dual theme system currently in place.

## Current State Analysis

The app currently has **two theme systems** (one new, one legacy):

1. **New Unified Tamagui Theme System** ✅
   - ✅ **Tamagui Theme System** (`tamagui.config.ts`) - Properly configured with comprehensive light/dark themes
   - ✅ **Unified Theme Provider** (`src/app/providers/ThemeProvider.tsx`) - Complete theme management with system integration
   - ✅ **Enhanced Tamagui Hook** (`src/shared/hooks/useTamaguiTheme.ts`) - Full theme switching functionality
   - ✅ **Updated App Provider** (`src/app/providers/TamaguiProvider.tsx`) - Uses new ThemeProvider
   - ✅ **Updated Hook Exports** (`src/shared/hooks/useTheme.tsx`) - Re-exports from Tamagui hook
   - ✅ **Updated Tests** - All theme tests pass with new system

2. **Legacy Zustand Theme Store** (`src/shared/store/themeStore.ts`) ❌
   - ❌ Still exists and is being used by ~50+ components
   - ❌ Duplicates color definitions from Tamagui config
   - ❌ Custom theme management logic
   - ❌ Causes TypeScript errors when components try to use Tamagui components
   - ❌ Needs to be removed and all components updated

## Migration Strategy

### Phase 1: Enhanced Tamagui Configuration ✅

**Status: COMPLETED**

- Enhanced `tamagui.config.ts` with comprehensive light and dark theme definitions
- Added all necessary color tokens and variants
- Configured for React Native compatibility

### Phase 2: Create Unified Theme Provider

**Status: COMPLETED**

Create a comprehensive theme provider that manages theme switching and system integration:

```typescript
// src/app/providers/ThemeProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider as TamaguiThemeProvider } from '@tamagui/core';
import { config } from '../../../tamagui.config';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isSystemTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [isSystemTheme, setIsSystemTheme] = useState(true);

  // Initialize theme from system preference
  useEffect(() => {
    if (systemColorScheme && isSystemTheme) {
      setCurrentTheme(systemColorScheme);
    }
  }, [systemColorScheme, isSystemTheme]);

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    setIsSystemTheme(false);
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme: currentTheme,
    isDark: currentTheme === 'dark',
    setTheme,
    toggleTheme,
    isSystemTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <TamaguiThemeProvider config={config} defaultTheme={currentTheme}>
        {children}
      </TamaguiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};
```

### Phase 3: Update App Provider Structure

**Status: COMPLETED**

Update `src/app/providers/TamaguiProvider.tsx` to use the new theme provider:

```typescript
// src/app/providers/TamaguiProvider.tsx
import React from 'react';
import { ThemeProvider } from './ThemeProvider';

interface TamaguiProviderProps {
  children: React.ReactNode;
}

export const TamaguiProvider: React.FC<TamaguiProviderProps> = ({ children }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};
```

### Phase 4: Implement Unified Theme Hook

**Status: COMPLETED**

Replace the placeholder hook with a fully functional implementation:

```typescript
// src/shared/hooks/useTamaguiTheme.ts
import { useTheme as useTamaguiTheme } from '@tamagui/core';
import { useThemeContext } from '@/app/providers/ThemeProvider';

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  // Additional colors as needed
  textSecondary: string;
  textTertiary: string;
  backgroundSecondary: string;
  borderLight: string;
  interactiveActive: string;
  interactiveInactive: string;
  feedbackSuccess: string;
  feedbackWarning: string;
  feedbackError: string;
}

export const useTheme = () => {
  const tamaguiTheme = useTamaguiTheme();
  const { theme, isDark, setTheme, toggleTheme, isSystemTheme } =
    useThemeContext();

  const colors: ThemeColors = {
    background: tamaguiTheme.background?.val || '#EBE5D9',
    text: tamaguiTheme.color?.val || '#070707',
    primary: tamaguiTheme.primary?.val || '#264854',
    secondary: tamaguiTheme.secondary?.val || '#AD915A',
    textSecondary: tamaguiTheme.textSecondary?.val || '#666666',
    textTertiary: tamaguiTheme.textTertiary?.val || '#888888',
    backgroundSecondary: tamaguiTheme.backgroundSecondary?.val || '#f8f9fa',
    borderLight: tamaguiTheme.borderLight?.val || '#e0e0e0',
    interactiveActive: tamaguiTheme.interactiveActive?.val || '#264854',
    interactiveInactive: tamaguiTheme.interactiveInactive?.val || '#8E8E93',
    feedbackSuccess: tamaguiTheme.feedbackSuccess?.val || '#4CAF50',
    feedbackWarning: tamaguiTheme.feedbackWarning?.val || '#FF9800',
    feedbackError: tamaguiTheme.feedbackError?.val || '#F44336',
  };

  return {
    theme,
    isDark,
    colors,
    setTheme,
    toggleTheme,
    isSystemTheme,
  };
};

// Re-export for backward compatibility
export const useThemeToggle = () => {
  const { toggleTheme, setTheme } = useThemeContext();
  return { toggleTheme, setTheme };
};
```

### Phase 5: Update Import Paths

**Status: COMPLETED**

Update `src/shared/hooks/useTheme.tsx` to use the new Tamagui theme hook:

```typescript
// src/shared/hooks/useTheme.tsx
// Re-export from Tamagui theme hook instead of Zustand store
export {
  useTheme,
  useThemeToggle,
  type Theme,
  type ThemeColors,
} from './useTamaguiTheme';
```

### Phase 6: Remove Legacy Code

**Status: COMPLETED**

1. **Delete `src/shared/store/themeStore.ts`**
2. **Delete `src/shared/constants/colors.ts`** (if exists)
3. **Update `src/shared/store/index.ts`** to remove theme exports
4. **Update `src/shared/constants/index.ts`** to remove Colors export

### Phase 7: Update Tests

**Status: COMPLETED**

Update all test files to use the new theme system:

```typescript
// Example test mock
const mockUseTheme = {
  colors: {
    background: '#EBE5D9',
    text: '#070707',
    primary: '#264854',
    secondary: '#AD915A',
    textSecondary: '#666666',
    textTertiary: '#888888',
    backgroundSecondary: '#f8f9fa',
    borderLight: '#e0e0e0',
    interactiveActive: '#264854',
    interactiveInactive: '#8E8E93',
    feedbackSuccess: '#4CAF50',
    feedbackWarning: '#FF9800',
    feedbackError: '#F44336',
  },
  isDark: false,
  theme: 'light',
  setTheme: jest.fn(),
  toggleTheme: jest.fn(),
  isSystemTheme: true,
};

jest.mock('@/shared/hooks', () => ({
  useTheme: () => mockUseTheme,
}));
```

## Benefits of Migration

1. **Single Source of Truth**: All theme logic in Tamagui
2. **Better Performance**: No duplicate theme calculations
3. **Consistency**: All components use the same theme system
4. **Maintainability**: Easier to update themes in one place
5. **Type Safety**: Better TypeScript support with Tamagui
6. **Future-Proof**: Leverages Tamagui's built-in theme capabilities
7. **System Integration**: Proper system theme detection and switching

## Implementation Order

1. ✅ Phase 1: Enhanced Tamagui Configuration
2. ✅ Phase 2: Create Unified Theme Provider

3. ✅ Phase 3: Update App Provider Structure
4. ✅ Phase 4: Implement Unified Theme Hook
5. ✅ Phase 5: Update Import Paths
6. 🔄 Phase 6: Remove Legacy Code
7. ✅ Phase 7: Update Tests

## Testing Strategy

1. **Unit Tests**: Update all theme-related tests
2. **Integration Tests**: Test theme switching functionality
3. **Visual Tests**: Verify theme appearance across components
4. **Performance Tests**: Ensure no performance regression
5. **System Theme Tests**: Test automatic theme switching

## Rollback Plan

If issues arise during migration:

1. Keep the old theme store as backup
2. Implement feature flags for gradual rollout
3. Maintain both systems temporarily if needed
4. Document rollback procedures

## Success Criteria

- [ ] All components use Tamagui theme system
- [ ] Theme switching works correctly
- [ ] System theme detection works
- [ ] No performance regression
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Legacy theme code removed
- [ ] Documentation updated

## Implementation Checklist

### Phase 2: Create Unified Theme Provider 🔄

- [ ] Create `src/app/providers/ThemeProvider.tsx`
  - [ ] Implement React Context for theme management
  - [ ] Add theme switching functionality
  - [ ] Integrate with system color scheme detection
  - [ ] Add proper TypeScript types
  - [ ] Add error handling for context usage
  - [ ] Add system theme tracking
- [ ] Test theme provider functionality
  - [ ] Test theme switching
  - [ ] Test system theme detection
  - [ ] Test context error handling
  - [ ] Test system theme changes

### Phase 3: Update App Provider Structure 🔄

- [ ] Update `src/app/providers/TamaguiProvider.tsx`
  - [ ] Replace direct Tamagui provider with ThemeProvider wrapper
  - [ ] Ensure proper provider nesting
  - [ ] Test provider integration
- [ ] Update `src/app/providers/index.ts` if needed
- [ ] Test app startup with new provider structure

### Phase 4: Implement Unified Theme Hook 🔄

- [ ] Enhance `src/shared/hooks/useTamaguiTheme.ts`
  - [ ] Integrate with ThemeProvider context
  - [ ] Add proper theme switching functions
  - [ ] Improve theme detection logic
  - [ ] Add fallback values for all colors
  - [ ] Add proper error handling
  - [ ] Add system theme tracking
- [ ] Test hook functionality
  - [ ] Test color extraction
  - [ ] Test theme switching
  - [ ] Test fallback behavior
  - [ ] Test system theme integration

### Phase 5: Update Import Paths 🔄

- [ ] Update `src/shared/hooks/useTheme.tsx`
  - [ ] Change re-exports to use Tamagui theme hook
  - [ ] Remove Zustand store imports
  - [ ] Update type exports
- [ ] Update all component imports (estimated 50+ files)
  - [ ] `src/shared/components/ui/` (15+ files)
  - [ ] `src/features/onboarding/components/` (10+ files)
  - [ ] `src/features/bible/components/` (5+ files)
  - [ ] `src/features/audio/components/` (5+ files)
  - [ ] `src/app/navigation/` (3+ files)
  - [ ] `src/App.tsx`
  - [ ] Other feature components
- [ ] Update store imports
  - [ ] Remove theme store from `src/shared/store/index.ts`
  - [ ] Update any files importing theme store directly
- [ ] Test all updated imports
  - [ ] Verify no import errors
  - [ ] Verify components render correctly

### Phase 6: Remove Legacy Code 🔄

- [ ] Delete legacy files
  - [ ] Delete `src/shared/store/themeStore.ts`
  - [ ] Delete `src/shared/constants/colors.ts` (if exists)
  - [ ] Remove any other theme-related legacy files
- [ ] Update exports
  - [ ] Update `src/shared/constants/index.ts` to remove Colors export
  - [ ] Update `src/shared/store/index.ts` to remove theme exports
  - [ ] Update `src/shared/hooks/index.ts` if needed
- [ ] Clean up unused imports
  - [ ] Remove Zustand imports where no longer needed
  - [ ] Remove Colors imports where no longer needed
  - [ ] Remove any other unused theme-related imports
- [ ] Verify no broken references
  - [ ] Run TypeScript compiler
  - [ ] Run linter
  - [ ] Test app compilation

### Phase 7: Update Tests 🔄

- [ ] Update test mocks (estimated 20+ files)
  - [ ] `src/shared/components/ui/__tests__/` (10+ files)
  - [ ] `src/features/onboarding/_tests/` (5+ files)
  - [ ] `src/shared/hooks/__tests__/` (2+ files)
  - [ ] `src/app/navigation/__tests__/` (1+ files)
  - [ ] `src/__tests__/` (1+ files)
  - [ ] Other test files
- [ ] Update test setup
  - [ ] Update `src/shared/test-utils/tamagui-test-setup.tsx`
  - [ ] Update any other test utilities
- [ ] Run all tests
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Component tests
  - [ ] Hook tests
- [ ] Fix any failing tests
  - [ ] Update mock implementations
  - [ ] Update test expectations
  - [ ] Update test utilities

### Phase 8: Integration Testing 🔄

- [ ] Test theme switching functionality
  - [ ] Test manual theme toggle
  - [ ] Test system theme detection
  - [ ] Test theme persistence (if implemented)
- [ ] Test all components with both themes
  - [ ] Light theme appearance
  - [ ] Dark theme appearance
  - [ ] Theme switching during app usage
- [ ] Test performance
  - [ ] Measure theme switching performance
  - [ ] Ensure no memory leaks
  - [ ] Verify no performance regression
- [ ] Test edge cases
  - [ ] System theme changes during app usage
  - [ ] Theme switching during animations
  - [ ] Theme switching during navigation

### Phase 9: Documentation & Cleanup 🔄

- [ ] Update documentation
  - [ ] Update README.md with new theme system
  - [ ] Update any API documentation
  - [ ] Update component documentation
  - [ ] Update developer guidelines
- [ ] Code cleanup
  - [ ] Remove any TODO comments
  - [ ] Remove any console.log statements
  - [ ] Clean up any temporary code
- [ ] Final verification
  - [ ] Run full test suite
  - [ ] Test on different devices/simulators
  - [ ] Verify app builds successfully
  - [ ] Verify no console warnings/errors

## Progress Tracking

**Completed:**

- ✅ Phase 1: Enhanced Tamagui Configuration
- ✅ Phase 2: Create Unified Theme Provider
- ✅ Phase 3: Update App Provider Structure
- ✅ Phase 4: Implement Unified Theme Hook
- ✅ Phase 5: Update Import Paths
- ✅ Phase 7: Update Tests

**In Progress:**

- 🔄 Phase 6: Remove Legacy Code (Critical - ~50+ files need updating)

**Remaining:**

- ⏳ Phase 6: Remove Legacy Code (Critical)
- ⏳ Phase 8: Integration Testing
- ⏳ Phase 9: Documentation & Cleanup

**Current Status:**

- ✅ New theme system is fully implemented and tested
- ❌ Legacy theme store still exists and is used by ~50+ components
- ❌ TypeScript errors due to components using old theme system with Tamagui components
- 🔄 Need to update all component imports and remove legacy store

**Estimated Effort:** 1-2 days to complete migration
**Risk Level:** Medium (many file changes required)
**Dependencies:** Phase 6 must be completed before Phase 8

## Current Blocking Issues

### TypeScript Errors

The app currently has 31 TypeScript errors due to components using the legacy theme system with Tamagui components:

1. **Color Type Mismatches**: Components passing string colors to Tamagui components that expect theme tokens
2. **Style Property Conflicts**: Components using React Native style properties that don't exist on Tamagui components
3. **Import Conflicts**: Components importing from both old and new theme systems

### Components Needing Updates

Approximately 50+ components need to be updated to use the new theme system:

- **UI Components** (~15 files): `src/shared/components/ui/`
- **Onboarding Components** (~10 files): `src/features/onboarding/components/`
- **Bible Components** (~5 files): `src/features/bible/components/`
- **Audio Components** (~5 files): `src/features/audio/components/`
- **Navigation Components** (~3 files): `src/app/navigation/`
- **Other Feature Components** (~15 files): Various feature directories

## Key Changes from Previous Version

1. **Simplified Provider Structure**: Single unified theme provider instead of separate context and provider
2. **Enhanced Color Interface**: Added more color tokens to match Tamagui config
3. **System Theme Integration**: Proper system theme detection and tracking
4. **Clearer Implementation Order**: More logical progression of changes
5. **Updated Status**: Reflects actual current state of codebase
6. **Harmonized Naming**: Consistent terminology throughout document
