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
- **Expo** (Bare workflow with custom development builds)
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
- **Xcode** (macOS only, for iOS development)
- **Android Studio** (for Android development)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Every-Language/everylanguage-bible.git
cd everylanguage-bible
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

### 4. Install iOS Dependencies (macOS only)

```bash
cd ios && pod install && cd ..
```

### 5. Start Development Server

```bash
npm start
# or
yarn start
```

### 6. Run on Device/Simulator

```bash
# iOS
npm run ios
# or
yarn ios

# Android
npm run android
# or
yarn android
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

## 🚢 Deployment

### Development Builds

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for development
eas build --profile development --platform all
```

### Production Release

```bash
# Build for production
eas build --profile production --platform all

# Submit to app stores
eas submit --platform all
```

## 📊 Monitoring & Analytics

- **Error Monitoring**: Sentry dashboard for crash reports and performance
- **Analytics**: PostHog for user behavior and feature usage
- **Performance**: Custom metrics for audio playback and sync performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Style

- Follow existing code patterns and conventions
- Ensure all tests pass
- Maintain test coverage above 80%
- Update documentation for new features
- Use TypeScript strictly

## 📖 Documentation

- [Project Setup Checklist](docs/planning/project-setup-checklist.md)
- [Codebase Organization](docs/guidelines/codebase-organization.md)
- [Tech Stack Details](docs/guidelines/tech-stack.md)
- [Testing Strategy](docs/guidelines/testing.md)
- [CI/CD Pipeline](docs/guidelines/ci-cd.md)
- [Code Quality Tools](docs/guidelines/code-quality-tools.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- Create an [issue](https://github.com/Every-Language/everylanguage-bible/issues) for bug reports
- Start a [discussion](https://github.com/Every-Language/everylanguage-bible/discussions) for questions
- Contact the development team for urgent matters

---
