# Project Setup Checklist

## Overview

This checklist covers everything needed to set up the multilingual audio Bible app project from scratch to a team-ready development environment. Complete each section in order.

## Prerequisites

### Required Accounts & Services

- [x] **GitHub Account** - For code repository and CI/CD
- [x] **Expo Account** - For builds and OTA updates
- [x] **Apple Developer Account** - For iOS deployment ($99/year)
- [x] **Google Play Console Account** - For Android deployment ($25 one-time)
- [x] **Supabase Account** - For backend services and auth
- [x] **Backblaze Account** - For B2 file storage
- [x] **PostHog Account** - For analytics
- [x] **Sentry Account** - For error monitoring

### Development Environment

- [x] **Node.js** - Install LTS version (v18+) ✅ v20.19.0
- [x] **npm/yarn** - Package manager (yarn recommended) ✅ npm v10.8.2, yarn v1.22.22
- [x] **Git** - Version control ✅ v2.47.0
- [x] **Cursor** - Recommended IDE with extensions:
  - [x] React Native Tools
  - [x] ES7+ React/Redux/React-Native snippets
  - [x] Prettier
  - [x] ESLint
  - [ ] TypeScript Importer
  - [x] GitLens
- [x] **Xcode** - For iOS development (macOS only) ✅ v16.4
- [x] **Android Studio** - For Android development
- [x] **Flipper** - For debugging and performance monitoring

## Phase 1: Project Initialization

### 1.1 Create Repository

- [x] Create new GitHub repository: https://github.com/Every-Language/everylanguage-bible.git
- [x] Initialize with README.md
- [x] Add `.gitignore` for React Native
- [ ] Set up branch protection rules for `main` and `develop` (GitHub web interface)
- [x] Create `develop` branch as default branch

### 1.2 Initialize React Native Project

```bash
# Create Expo project with bare workflow
npx create-expo-app BibleApp --template bare-minimum
cd BibleApp

# Initialize git if not already done
git init
git remote add origin https://github.com/Every-Language/everylanguage-bible.git
```

- [x] Run project initialization command
- [x] Test initial build on both platforms
- [x] Enable Fabric in `android/gradle.properties`:

```
newArchEnabled=true
```

- [x] Enable Fabric in iOS project settings

## Phase 2: Core Dependencies Installation

### 2.1 Install Core Packages

```bash
# Core framework dependencies
npx expo install expo-dev-client
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# State management and data fetching
npm install zustand @tanstack/react-query

# Database and sync
npx expo install expo-sqlite

# Authentication and backend
npm install @supabase/supabase-js

# UI and styling
npm install @tamagui/core @tamagui/animations-react-native @tamagui/config
npm install react-native-reanimated react-native-gesture-handler

# Audio and media
npx expo install expo-audio expo-av

# Internationalization
npm install react-native-localize i18next react-i18next

# Analytics and monitoring
npm install posthog-react-native @sentry/react-native

# Notifications
npx expo install expo-notifications expo-device

# File storage and networking
npm install @react-native-async-storage/async-storage
npx expo install expo-file-system expo-sharing
```

- [x] Install all core dependencies
- [x] Verify no peer dependency warnings
- [x] Test that project still builds

### 2.2 Install Development Dependencies

```bash
# Testing
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
npm install --save-dev detox

# Code quality
npm install --save-dev eslint prettier @typescript-eslint/eslint-plugin
npm install --save-dev @typescript-eslint/parser eslint-plugin-react-native

# Build and deployment
npm install --save-dev @expo/cli eas-cli
```

- [x] Install all dev dependencies
- [x] Configure ESLint and Prettier
- [x] Set up pre-commit hooks with husky

## Phase 3: Project Configuration

### 3.1 TypeScript Configuration

- [x] Create/update `tsconfig.json`:
- [x] Configure path aliases in Metro config
- [x] Test TypeScript compilation

### 3.2 Project Structure

Create a feature first project structure

- [x] Create folder structure
- [x] Add index.ts files for clean imports
- [x] Set up absolute imports

### 3.3 Environment Configuration

- [x] Create `.env.example`:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backblaze B2
BACKBLAZE_KEY_ID=your_key_id
BACKBLAZE_APPLICATION_KEY=your_app_key
BACKBLAZE_BUCKET_NAME=your_bucket_name

```

- [ ] Create `.env` file with actual values
- [ ] Add `.env` to `.gitignore`
- [ ] Configure Expo environment variables

## Phase 4: Service Configuration

### 4.1 Supabase Setup

- [x] Create new Supabase project
- [x] Set up authentication providers (email, phone)
- [ ] Generate and save API keys
- [ ] Test connection from app
      but

### 4.3 Backblaze B2 Setup

- [ ] Create B2 bucket for audio files
- [ ] Configure bucket permissions
- [ ] Set up CDN (if needed)
- [ ] Create API keys
- [ ] Test file upload/download

### 4.4 Analytics Setup

- [ ] Create PostHog project
- [ ] Configure event tracking
- [ ] Set up custom properties
- [ ] Test event capture
- [ ] Create analytics dashboard

### 4.5 Error Monitoring Setup

- [ ] Create Sentry project
- [ ] Configure React Native integration
- [ ] Set up error boundaries
- [ ] Test error reporting
- [ ] Configure alert rules

## Phase 5: CI/CD Pipeline Setup

### 5.1 EAS Configuration

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Initialize EAS: `eas build:configure`
- [ ] Configure `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] Test development build
- [ ] Configure app signing

### 5.2 GitHub Actions Setup

Create `.github/workflows/` directory and add:

- [ ] **CI Pipeline** (`.github/workflows/ci.yml`):

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Type check
        run: npx tsc --noEmit
```

- [ ] **Security Scan** (`.github/workflows/security.yml`)
- [ ] **Staging Deployment** (`.github/workflows/cd-staging.yml`)
- [ ] **Production Deployment** (`.github/workflows/cd-production.yml`)

### 5.3 Code Quality Setup

- [ ] Set up code coverage reporting
- [ ] Configure dependency scanning
- [ ] Add quality gates to PR process

## Phase 6: Testing Setup

### 6.1 Unit Testing Configuration

- [ ] Configure Jest with React Native preset
- [ ] Set up testing utilities
- [ ] Create test setup file
- [ ] Write example tests
- [ ] Configure coverage thresholds

### 6.2 E2E Testing Setup

- [ ] Install and configure Detox
- [ ] Set up test devices/simulators
- [ ] Create initial E2E test suite
- [ ] Configure CI integration
- [ ] Test on both platforms

### 6.3 Performance Testing

- [ ] Set up Flipper integration
- [ ] Configure performance monitoring
- [ ] Create performance benchmarks
- [ ] Set up automated performance testing

## Phase 7: Development Tools & Standards

### 7.1 Code Quality Tools

- [ ] Configure ESLint rules
- [ ] Set up Prettier formatting
- [ ] Configure import sorting
- [ ] Set up pre-commit hooks with husky
- [ ] Configure VS Code settings

### 7.2 Documentation Setup

- [ ] Create README.md with setup instructions
- [ ] Document coding standards
- [ ] Create API documentation structure
- [ ] Set up component documentation
- [ ] Create troubleshooting guide

### 7.3 Git Configuration

- [ ] Set up conventional commit messages
- [ ] Configure branch naming conventions
- [ ] Set up PR templates
- [ ] Configure issue templates
- [ ] Set up automated changelog generation

## Phase 8: Team Onboarding Preparation

### 8.1 Developer Documentation

- [ ] Create developer onboarding guide
- [ ] Document local development setup
- [ ] Create debugging guide
- [ ] Document deployment process
- [ ] Create architecture overview

### 8.2 Access Management

- [ ] Set up GitHub team permissions
- [ ] Configure service account access
- [ ] Create development environment access
- [ ] Set up code review requirements
- [ ] Configure notification settings

### 8.3 Development Workflow

- [ ] Document feature development process
- [ ] Create PR review checklist
- [ ] Set up issue tracking workflow
- [ ] Configure automated notifications
- [ ] Create release process documentation

## Phase 9: Initial Implementation

### 9.1 Core App Structure

- [ ] Set up navigation structure
- [ ] Create basic screen components
- [ ] Implement theme system
- [ ] Set up state management
- [ ] Create utility functions

### 9.2 Database Schema

- [ ] Implement Drizzle schema
- [ ] Set up migrations
- [ ] Create seed data
- [ ] Test database operations
- [ ] Set up sync configuration

### 9.3 Authentication Flow

- [ ] Implement login/signup screens
- [ ] Set up Supabase auth integration
- [ ] Create auth state management
- [ ] Test authentication flow
- [ ] Implement offline auth handling

## Phase 10: Verification & Testing

### 10.1 Build Verification

- [ ] Test iOS development build
- [ ] Test Android development build
- [ ] Verify all dependencies work
- [ ] Test on physical devices
- [ ] Verify performance on older devices

### 10.2 CI/CD Verification

- [ ] Test CI pipeline with sample PR
- [ ] Verify all quality gates work
- [ ] Test staging deployment
- [ ] Verify rollback procedures
- [ ] Test notification systems

### 10.3 Service Integration Testing

- [ ] Test Supabase integration
- [ ] Test file storage operations
- [ ] Verify analytics tracking
- [ ] Test error monitoring
