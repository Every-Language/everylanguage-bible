# Every Language Bible App

A React Native mobile application providing offline-first access to multilingual audio Bible content, designed to make Scripture accessible across language barriers worldwide.

## 🌟 Features

- **Offline-First Architecture**: Full functionality without internet connectivity
- **Multilingual Support**: Audio Bible content in multiple languages
- **Real-time Sync**: Seamless data synchronization when online
- **Audio Playback**: High-quality audio with background playback support
- **Search & Discovery**: Find verses, chapters, and content across languages
- **Bookmarks & Favorites**: Save and organize important passages
- **Content Sharing**: Share verses and audio with deep linking
- **Cross-platform**: Native iOS and Android applications
- **Accessibility**: Full screen reader and accessibility support

## 🏗️ Architecture

This project uses a **feature-first architecture** with offline-first design principles:

- **Frontend**: React Native with New Architecture (Fabric + TurboModules)
- **Database**: SQLite with Drizzle ORM for local storage
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Sync**: PowerSync for real-time offline-first synchronization
- **File Storage**: Backblaze B2 for audio file delivery
- **State Management**: Zustand + TanStack Query
- **UI Framework**: Tamagui for consistent design system

## 🛠️ Tech Stack

### Core Framework

- **React Native** (New Architecture enabled)
- **Expo** (Managed workflow with custom development builds)
- **TypeScript** (Strict mode enabled)

### Data & Backend

- **SQLite** + **Drizzle ORM** (Local database)
- **Supabase** (Authentication & PostgreSQL)
- **PowerSync** (Real-time sync)
- **Backblaze B2** (File storage & CDN)

### State & UI

- **Zustand** (Global state management)
- **TanStack Query** (Server state management)
- **Tamagui** (UI components & styling)
- **React Navigation** (Navigation)

### Media & Features

- **Expo Audio** (Audio playback)
- **i18next** (Internationalization)
- **Expo Notifications** (Push notifications)

### Development & Quality

- **ESLint** + **Prettier** (Code quality)
- **Jest** + **React Native Testing Library** (Unit testing)
- **Detox** (E2E testing)
- **Husky** (Git hooks)

### Analytics & Monitoring

- **PostHog** (Analytics & feature flags)
- **Sentry** (Error monitoring)

## 📋 Prerequisites

### Required Accounts & Services

- [GitHub Account](https://github.com) - Code repository
- [Expo Account](https://expo.dev) - Builds and OTA updates
- [Apple Developer Account](https://developer.apple.com) - iOS deployment ($99/year)
- [Google Play Console](https://play.google.com/console) - Android deployment ($25 one-time)
- [Supabase Account](https://supabase.com) - Backend services
- [Backblaze Account](https://www.backblaze.com) - File storage

### Development Environment

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v10+ or **yarn** v1.22+
- **Git** ([Download](https://git-scm.com/))
- **Expo CLI** v6+ (`npm install -g @expo/cli`)
- **EAS CLI** for builds (`npm install -g eas-cli`)
- **Xcode** 15+ (macOS only, for iOS simulator) - optional, only for local builds
- **Android Studio** with Android SDK (for Android emulator) - optional, only for local builds

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Every-Language/everylanguage-bible.git
cd everylanguage-bible
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

### 4. Login to Expo

```bash
npx expo login
```

### 6. Start Development Server

```bash
npx expo start
```

## 📁 Project Structure

```
src/
├── app/                    # App-level configuration
│   ├── navigation/         # Navigation setup and routing
│   ├── providers/         # Top-level providers (auth, theme, query)
│   └── config/            # App configuration and constants
├── features/              # Feature modules (domain-driven)
│   ├── auth/              # Authentication
│   ├── bible/             # Bible reading
│   ├── audio/             # Audio playback
│   ├── search/            # Search functionality
│   ├── bookmarks/         # Bookmarks and favorites
│   ├── settings/          # App settings
│   ├── sync/              # Data synchronization
│   └── sharing/           # Content sharing
└── shared/                # Shared utilities and components
    ├── components/        # Reusable UI components
    ├── hooks/             # Custom hooks
    ├── services/          # API and service integrations
    ├── utils/             # Utility functions
    ├── types/             # TypeScript type definitions
    └── constants/         # App-wide constants
```

## 🧪 Testing

### Run Unit Tests

```bash
npm test
# or
yarn test
```

### Run E2E Tests

```bash
npm run test:e2e
# or
yarn test:e2e
```

### Test Coverage

```bash
npm run test:coverage
# or
yarn test:coverage
```

## 🔧 Development Workflow

### Code Quality

This project uses automated code quality tools:

- **ESLint** - Linting and code standards
- **Prettier** - Code formatting
- **Husky** - Pre-commit hooks

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Git Workflow

1. Create feature branch from `develop`
2. Make changes with tests
3. Commit using conventional commit messages
4. Push and create pull request
5. Merge after code review and CI passes

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `hotfix/*` - Emergency fixes

### Expo Development Workflow

This project uses Expo managed workflow with custom development builds:

1. **Development**: Use `npx expo start` for hot reloading
2. **Native Changes**: When adding native modules, rebuild with `eas build --profile development`
3. **Testing**: Use development builds for comprehensive testing
4. **Updates**: Push JavaScript-only updates via EAS Update for instant deployment
5. **Builds**: All builds handled by EAS Build service in the cloud

## 🚢 Deployment

### CI/CD Pipeline

This project uses GitHub Actions with EAS Build for automated deployments:

- **Pull Requests**: Automated testing and preview builds
- **Develop Branch**: Development builds with internal distribution
- **Main Branch**: Production builds and app store submission
- **Release Tags**: Automated versioning and release notes

### Build Profiles

The project uses three build profiles defined in `eas.json`:

- **development**: For local testing with debugging enabled
- **preview**: For internal testing and TestFlight/Internal App Sharing
- **production**: For app store releases with optimizations enabled

## 📊 Monitoring & Analytics

- **Error Monitoring**: Sentry dashboard for crash reports and performance
- **Analytics**: PostHog for user behavior and feature usage
- **Performance**: Custom metrics for audio playback and sync performance

### Code Style

- Follow existing code patterns and conventions
- Ensure all tests pass
- Maintain test coverage above 80%
- Update documentation for new features
- Use TypeScript strictly
