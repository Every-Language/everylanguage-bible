# Onboarding Feature

A comprehensive onboarding experience for the Bible app that welcomes new users and introduces them to key features.

## Features

- **Multi-step onboarding flow** with beautiful animations
- **Persistent state management** using AsyncStorage
- **Database initialization** with progress tracking
- **Customizable content** with icons, titles, and descriptions
- **Smooth navigation** with pagination dots
- **Skip functionality** for users who want to jump straight in
- **Theme-aware design** that adapts to light/dark modes

## Components

### OnboardingScreen

The main screen that orchestrates the entire onboarding flow.

### OnboardingContainer

Manages the horizontal scrolling between onboarding steps and renders the appropriate step component based on the step type.

### OnboardingStep

Individual step component with animations and content display for regular onboarding steps.

### DatabaseInitStep

Specialized step component for database initialization with progress tracking and error handling.

### DatabaseTablesStep

Step component that shows database setup completion and table information.

### OnboardingPagination

Progress indicator with interactive dots for navigation.

## Usage

### Basic Integration

```tsx
import { OnboardingScreen } from '@/features/onboarding';

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <MainApp />;
};
```

### Customizing Onboarding Steps

You can customize the onboarding steps by modifying the `defaultSteps` array in `useOnboarding.ts`:

```tsx
const defaultSteps: OnboardingStepData[] = [
  {
    id: 'database-init',
    title: 'Database Initialization',
    subtitle: 'Setting up your Bible app',
    description:
      "We're preparing your Bible app with all the features you need...",
    icon: '📖',
    isDatabaseStep: true,
  },
  // Add more steps...
];
```

### Resetting Onboarding

To reset the onboarding state (useful for testing or allowing users to replay):

```tsx
import { useOnboarding } from '@/features/onboarding';

const { resetOnboarding } = useOnboarding();

const handleReset = () => {
  resetOnboarding();
  // Show onboarding again
};
```

## Default Steps

The onboarding includes 6 default steps:

1. **Database Initialization** - Sets up the local database
2. **Local Database** - Shows database tables and structure
3. **Read Scripture** - Multiple translations available
4. **Listen to Audio** - Audio Bible versions
5. **Study Tools** - Bookmarking and organization
6. **Stay Connected** - Sync across devices

## Styling

The onboarding feature uses the app's theme system and automatically adapts to light/dark modes. All colors, spacing, and typography are consistent with the app's design system.

## State Management

Onboarding state is persisted using AsyncStorage with the key `@bible_app_onboarding`. The state includes:

- `isCompleted`: Whether the user has completed onboarding
- `currentStep`: The current step index
- `steps`: Array of onboarding step data

## Database Integration

The onboarding feature integrates with the app's database system:

- **Auto-initialization**: Database initialization starts automatically when the database step becomes active
- **Progress tracking**: Real-time progress updates during database setup
- **Error handling**: Graceful error handling with retry functionality
- **Skip option**: Users can skip database setup if needed

## Accessibility

The onboarding feature includes:

- Proper semantic markup
- Touch targets that meet accessibility guidelines
- Clear visual indicators for current step
- Skip functionality for users who want to proceed quickly
- Screen reader friendly content

## Architecture

The onboarding feature follows a clean architecture pattern:

- **Types**: Well-defined TypeScript interfaces
- **Hooks**: Custom hooks for state management
- **Components**: Reusable, composable components
- **Screens**: Screen-level components for navigation
- **Services**: Integration with database and storage services
