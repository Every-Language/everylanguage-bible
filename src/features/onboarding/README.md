# Onboarding Feature

A comprehensive onboarding experience for the Bible app that welcomes new users and introduces them to key features.

## Features

- **Multi-step onboarding flow** with beautiful animations
- **Persistent state management** using AsyncStorage
- **Customizable content** with icons, titles, and descriptions
- **Smooth navigation** with pagination dots
- **Skip functionality** for users who want to jump straight in
- **Theme-aware design** that adapts to light/dark modes

## Components

### OnboardingScreen

The main screen that orchestrates the entire onboarding flow.

### OnboardingContainer

Manages the horizontal scrolling between onboarding steps.

### OnboardingStep

Individual step component with animations and content display.

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
    id: 'welcome',
    title: 'Welcome to Bible App',
    subtitle: 'Your Personal Scripture Companion',
    description: 'Discover the Bible in a whole new way...',
    icon: '📖',
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

The onboarding includes 5 default steps:

1. **Welcome** - Introduction to the app
2. **Read Scripture** - Multiple translations available
3. **Listen to Audio** - Audio Bible versions
4. **Study Tools** - Bookmarking and organization
5. **Stay Connected** - Sync across devices

## Styling

The onboarding feature uses the app's theme system and automatically adapts to light/dark modes. All colors, spacing, and typography are consistent with the app's design system.

## State Management

Onboarding state is persisted using AsyncStorage with the key `@bible_app_onboarding`. The state includes:

- `isCompleted`: Whether the user has completed onboarding
- `currentStep`: The current step index
- `steps`: Array of onboarding step data

## Accessibility

The onboarding feature includes:

- Proper semantic markup
- Touch targets that meet accessibility guidelines
- Clear visual indicators for current step
- Skip functionality for users who want to proceed quickly
