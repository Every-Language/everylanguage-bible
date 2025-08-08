# Cursor Rules for React Native Development

This directory contains optimized Cursor rules designed to enhance LLM performance for React Native development with feature-first architecture, PowerSync offline-first database, theme system, and internationalization.

## Rules Overview

### 01-core.mdc (Always Applied) ⭐

**Core React Native and TypeScript development standards**

- Always active for all TypeScript/JavaScript files
- Foundational principles for React Native + Expo
- Performance best practices from React Native docs
- Error handling and code quality standards

### 02-typescript.mdc (Auto Attached)

**TypeScript best practices and type safety**

- Triggered for `.ts` and `.tsx` files
- Type definition standards
- Import/export patterns
- Error handling with proper typing

### 03-react-native.mdc (Auto Attached) ⭐

**React Native, Expo, PowerSync, Theme, and i18n patterns**

- Triggered for components and screens
- PowerSync database access patterns
- Theme system usage (NO inline styles)
- i18n translation patterns (NO hardcoded strings)
- Performance optimizations and offline-first development

### 04-feature-architecture.mdc (Auto Attached)

**Feature-first architecture organization**

- Triggered for files in `src/features/` and `src/shared/`
- Import rules and dependency management
- Directory structure standards
- Service layer patterns

### 05-code-quality.mdc (Auto Attached) ⭐

**Code quality, LLM optimization, and enforced patterns**

- Triggered for all code and markdown files
- Documentation and testing standards
- Required imports and anti-patterns
- PowerSync, theme, and i18n enforcement rules

### 06-database-patterns.mdc (Auto Attached) ⭐

**PowerSync database patterns for offline-first development**

- Triggered for service files and hooks
- Advanced PowerSync usage patterns
- TanStack Query integration
- Real-time updates and optimistic mutations
- Performance best practices

## Key Features Added

### 🔄 PowerSync Offline-First Database

- Proper PowerSync hooks usage (`usePowerSync`, `useSync`)
- TanStack Query integration for caching
- Service layer patterns for complex queries
- Real-time updates with PowerSync watch
- Optimistic updates and error handling
- Performance best practices and anti-patterns

### 🎨 Theme System (NO Inline Styles)

- Enforce theme system usage: `createThemedStyles((theme) => ({}))`
- Use theme hooks: `useThemeFromStore()`
- Access theme colors, spacing, typography, and borderRadius
- Prevent inline style anti-patterns
- Consistent design system usage

### 🌍 Internationalization (NO Hardcoded Strings)

- Enforce i18n usage: `const { t } = useTranslation()`
- Translation key patterns: `t('common.loading')`, `t('bible.chapter', { number: 1 })`
- Prevent hardcoded text strings
- Support for 10 languages (English, Spanish, French, German, Portuguese, Arabic, Chinese, Hindi, Russian, Japanese)

## Enforcement Patterns

### ✅ Required Patterns

```typescript
// Database access
import { usePowerSync } from '@/shared/hooks/usePowerSync';
const { data } = useQuery({
  queryKey: ['verses', chapterId],
  queryFn: () => localDataService.getVersesForUI(chapterId),
});

// Theme system
import { createThemedStyles } from '@/shared/utils/theme';
const useStyles = createThemedStyles((theme) => ({
  container: { backgroundColor: theme.colors.background },
}));

// Internationalization
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<Text>{t('common.loading')}</Text>
```

### ❌ Anti-Patterns (Forbidden)

```typescript
// NO direct database calls
const verses = await database.execute('SELECT * FROM verses');

// NO inline styles
<View style={{ backgroundColor: '#ffffff' }} />

// NO hardcoded strings
<Text>Loading...</Text>
```

## Optimizations for LLM Performance

### 1. Context-Aware Application

- Rules apply only when relevant files are referenced
- Smart glob patterns for targeted activation
- Minimal context window pollution

### 2. Comprehensive Patterns

- PowerSync database access patterns
- Theme system enforcement
- i18n translation patterns
- Performance optimizations
- Offline-first development

### 3. Clear Examples

- ✅ Good patterns with code examples
- ❌ Anti-patterns to avoid
- Specific import statements
- Real-world usage patterns

### 4. Tech Stack Alignment

Rules are specifically designed for:

- **React Native** with New Architecture
- **Expo Managed Workflow**
- **TypeScript** strict mode
- **PowerSync** for offline-first database
- **Supabase** for authentication and sync
- **Zustand** + **TanStack Query** for state
- **Feature-first architecture**
- **Theme system** for consistent styling
- **i18next** for internationalization

## Usage

These rules are automatically applied by Cursor based on:

- File types and glob patterns
- Always-apply settings for core rules
- Context-sensitive activation for specialized rules

## Testing the Enhanced Rules

Try asking Cursor to:

- Create a new React Native component with theme and i18n
- Implement PowerSync database queries
- Set up offline-first data fetching
- Create themed components without inline styles
- Add internationalization to existing components

The AI should automatically follow the offline-first, theme, and i18n patterns defined in these rules.

## Rule Types Used

- **Always Applied**: Core standards (01-core.mdc)
- **Auto Attached**: Context-sensitive rules that activate when matching files are referenced
- **Manual**: None - all rules are automatic for optimal LLM experience

This enhanced rules system provides comprehensive guidance for offline-first React Native development with proper theming and internationalization while minimizing context window usage for optimal LLM performance.
