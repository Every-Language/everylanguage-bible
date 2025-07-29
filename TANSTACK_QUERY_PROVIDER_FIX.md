# TanStack Query Provider Fix

## Problem

The app was throwing the error:

```
Error: No QueryClient set, use QueryClientProvider to set one
```

This error occurred in the `SyncProgressModal` component when it tried to use TanStack Query hooks (`useDataAvailabilityQuery`, `useDataCountsQuery`, `useLanguageTablesCountsQuery`) during the onboarding flow.

## Root Cause

The `QueryClientProvider` was only wrapping the main app content (when `showOnboarding` is false), but the onboarding screens (including `SyncProgressModal`) were rendered outside of the `QueryClientProvider`. This meant that any TanStack Query hooks used in onboarding components couldn't access the QueryClient.

## Solution

Moved the `QueryClientProvider` to wrap the entire `AppContent` component instead of just the main app content.

### Before (Incorrect):

```typescript
const App: React.FC = () => {
  return <AppContent />;
};

const AppContent: React.FC = () => {
  // ... initialization logic ...

  if (showOnboarding) {
    return <OnboardingScreen />; // ❌ No QueryClientProvider
  }

  return (
    <QueryClientProvider client={queryClient}> {/* ❌ Only wraps main app */}
      <HomeScreen />
    </QueryClientProvider>
  );
};
```

### After (Correct):

```typescript
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}> {/* ✅ Wraps entire app */}
      <AppContent />
    </QueryClientProvider>
  );
};

const AppContent: React.FC = () => {
  // ... initialization logic ...

  if (showOnboarding) {
    return <OnboardingScreen />; // ✅ Now has access to QueryClient
  }

  return <HomeScreen />; // ✅ Still has access to QueryClient
};
```

## Files Modified

- `src/app/AppWithStores.tsx` - Moved `QueryClientProvider` to wrap entire app

## Benefits

1. **Fixed TanStack Query Error**: All components now have access to the QueryClient
2. **Consistent Data Access**: Both onboarding and main app can use TanStack Query hooks
3. **Better Architecture**: Single QueryClient instance for the entire app
4. **Future-Proof**: Any new components can use TanStack Query hooks without issues

## Components That Now Work

- `SyncProgressModal` - Can use `useDataAvailabilityQuery`, `useDataCountsQuery`, etc.
- All onboarding screens - Can use any TanStack Query hooks
- Main app screens - Continue to work as before
- Any future components - Will have access to TanStack Query

## Testing

The fix ensures that:

1. Onboarding flow works without TanStack Query errors
2. `SyncProgressModal` can properly fetch data status
3. Main app continues to work normally
4. All TanStack Query hooks work consistently throughout the app
