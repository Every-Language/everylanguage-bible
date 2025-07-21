# Onboarding Feature

The onboarding feature uses a slide-based navigation system with three main screens.

## Structure

### Screens

1. **OnboardingMainScreen** - The main welcome screen with two navigation cards
2. **MotherTongueSearchScreen** - Language selection screen
3. **ImportBibleScreen** - Bible content import screen

### Components

- **OnboardingSlideContainer** - Manages navigation between the three screens
- **OnboardingScreen** - Main wrapper component

### Hooks

- **useOnboardingSlides** - Manages state for the slide-based onboarding flow

## Navigation Flow

```
OnboardingMainScreen
├── MotherTongueSearchScreen (via "Choose Your Language" card)
└── ImportBibleScreen (via "Import Bible Content" card)
```

Both sub-screens have back buttons that return to the main screen.

## Features

### OnboardingMainScreen

- Welcome message
- Database initialization and verification
- Two interactive cards for navigation

### MotherTongueSearchScreen

- Searchable language list
- Language selection with visual feedback
- Continue button to return to main screen

### ImportBibleScreen

- Bible version selection (text and audio)
- Import progress indicator
- Multiple version selection support

## Usage

```tsx
import { OnboardingScreen } from '@/features/onboarding';

<OnboardingScreen
  onComplete={() => {
    // Handle onboarding completion
  }}
/>;
```

## State Management

The onboarding state is persisted using AsyncStorage and includes:

- Completion status
- Selected language
- Imported Bible versions

## Styling

All screens use the app's theme system and are responsive to light/dark mode changes.
