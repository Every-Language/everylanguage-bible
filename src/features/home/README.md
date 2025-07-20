# Home Feature

The Home feature is the main screen of the Bible app that provides tab navigation between different sections of the application.

## Structure

```
src/features/home/
├── components/
│   ├── HomeContainer.tsx      # Manages content area based on active tab
│   ├── HomeTabNavigator.tsx   # Tab navigation component
│   └── index.ts              # Component exports
├── hooks/
│   ├── useHomeNavigation.ts   # Hook for managing tab state
│   └── index.ts              # Hook exports
├── screens/
│   ├── HomeScreen.tsx        # Main home screen component
│   └── index.ts              # Screen exports
├── types/
│   └── index.ts              # TypeScript type definitions
├── index.ts                  # Main feature exports
└── README.md                 # This file
```

## Components

### HomeScreen

The main screen component that orchestrates the entire home feature. It includes:

- TopBar with language selection and profile
- Tab navigation
- Content area
- Media player sheet
- Modals for profile/auth and language selection

### HomeTabNavigator

Handles the tab switching between Bible and Playlists sections.

### HomeContainer

Manages the content area and renders the appropriate screen based on the active tab.

## Hooks

### useHomeNavigation

Custom hook for managing tab navigation state:

```typescript
const { activeTab, switchTab } = useHomeNavigation('Bible');
```

## Types

- `HomeTab`: Union type for available tabs ('Bible' | 'Playlists')
- `HomeTabConfig`: Configuration interface for tabs
- `HomeScreenProps` & `HomeContainerProps`: Component prop interfaces

## Usage

The Home feature is used in the main App.tsx:

```typescript
import { HomeScreen } from '@/features/home';

const MainContent: React.FC = () => {
  return <HomeScreen />;
};
```

## Features

- **Tab Navigation**: Switch between Bible and Playlists sections
- **Language Selection**: Audio and text version selection modals
- **Profile Management**: User authentication and profile modals
- **Media Player**: Integrated media player sheet
- **Theme Support**: Full theme integration
- **Responsive Design**: Adapts to different screen sizes
