# Bible App Technology Stack

## Overview

This document outlines the complete technology stack and best practices for the multilingual audio Bible application. The stack is designed for offline-first operation, global scalability, accessibility, and performance on older Android devices.

## Core Framework

### React Native (New Architecture)

- **Version**: Latest stable with New Architecture enabled (0.80 at time of writing)
- **Architecture**: Fabric renderer + TurboModules for improved performance
- **Best Practices**:
  - Enable New Architecture in `react-native.config.js`
  - Use TypeScript for type safety
  - Implement proper error boundaries
  - Follow React Native performance guidelines
  - Use Flipper for debugging in development

### Expo Managed Workflow

- **Configuration**: Fully managed by Expo with no native folders
- **Build System**: EAS Build handles all native compilation on cloud servers
- **Best Practices**:
  - Use EAS Build for all builds (development, staging, production)
  - Configure app.json for all app settings and permissions
  - Use Expo Go for instant development testing
  - Leverage config plugins for native functionality
  - Use OTA updates for instant JavaScript deployments
  - Implement proper deep linking configuration
  - Use tunnel mode for restricted networks (`expo start --tunnel`)

## Data Layer

### SQLite + Drizzle ORM

- **Purpose**: Local offline-first database
- **Best Practices**:
  - Design schema with proper indexing for search performance
  - Use migrations for schema changes
  - Implement proper foreign key constraints
  - Use transactions for batch operations
  - Create database backup/restore mechanisms
  - Optimize queries for large datasets (audio metadata, verses)

### Supabase Authentication

- **Purpose**: User authentication and session management
- **Best Practices**:
  - Implement anonymous authentication for offline users
  - Use Row Level Security (RLS) policies
  - Handle authentication state changes properly
  - Implement secure token refresh mechanisms
  - Support social login providers where culturally appropriate

### Supabase PostgreSQL

- **Purpose**: Real-time offline-first sync between local SQLite and cloud PostgreSQL
- **Best Practices**:
  - Design sync rules based on user permissions and data requirements
  - Implement conflict resolution strategies
  - Use incremental sync for large datasets
  - Handle network connectivity changes gracefully
  - Monitor sync performance and errors
  - Implement proper data partitioning for global scale

### Backblaze B2 File Storage

- **Purpose**: Audio file storage and CDN delivery
- **Best Practices**:
  - Implement proper bucket organization and naming conventions
  - Use CDN for global content delivery
  - Implement progressive download for large audio files
  - Use proper caching strategies
  - Implement file integrity checks
  - Handle storage quota and billing monitoring

## State Management

### Zustand

- **Purpose**: Global application state management
- **Best Practices**:
  - Keep stores focused and modular
  - Use immer middleware for complex state updates
  - Implement proper TypeScript typing for stores
  - Use subscriptions for component-specific state
  - Implement persistence middleware for critical state
  - Avoid storing large objects in global state

### TanStack Query

- **Purpose**: Server state management, caching, and synchronization
- **Best Practices**:
  - Implement proper query key factories
  - Use optimistic updates for better UX
  - Configure appropriate stale times and cache times
  - Implement proper error handling and retry logic
  - Use mutations for data modifications
  - Implement offline query support

## Media & Audio

### Expo Audio

- **Purpose**: Audio playback and recording
- **Best Practices**:
  - Configure background audio playback properly
  - Implement proper audio session management
  - Handle audio interruptions (calls, notifications)
  - Use appropriate audio quality settings for different network conditions
  - Implement proper cleanup of audio resources
  - Support accessibility features (voice control, screen readers)

### Expo Video (Future)

- **Purpose**: Video content playback for gospel films
- **Best Practices**:
  - Implement adaptive bitrate streaming
  - Use proper video caching strategies
  - Handle device orientation changes
  - Implement accessibility features (captions, audio descriptions)

## User Interface

### Tamagui

- **Purpose**: UI component library and styling system
- **Best Practices**:
  - Create consistent design tokens for the app theme
  - Implement proper dark/light mode support
  - Use responsive design principles for various screen sizes
  - Implement accessibility features (ARIA labels, focus management)
  - Create reusable component variants
  - Optimize bundle size by using only needed components
  - Implement proper theme switching mechanisms

## Analytics & Monitoring

### PostHog

- **Purpose**: Geographical user behavior tracking for later language mapping
- **Best Practices**:
  - Implement privacy-compliant event tracking
  - Use feature flags for gradual rollouts
  - Create meaningful event taxonomies
  - Implement proper user identification (anonymous by default)
  - Use cohort analysis for user segmentation
  - Implement custom dashboards for ministry insights

### Custom Offline Analytics Queue

- **Purpose**: Queue analytics events for offline scenarios
- **Best Practices**:
  - Implement persistent queue using SQLite
  - Use exponential backoff for retry logic
  - Batch events for efficient network usage
  - Handle queue size limits and cleanup
  - Implement proper error handling and logging
  - Ensure data privacy in queued events

### Sentry

- **Purpose**: Error monitoring and performance tracking
- **Best Practices**:
  - Configure proper error filtering and sampling
  - Implement custom error boundaries
  - Use performance monitoring for critical user flows
  - Set up proper alerting for critical errors
  - Implement user feedback collection
  - Use release tracking for deployment monitoring

## Internationalization

### i18n (React Native Localize + i18next)

- **Purpose**: Multi-language support and localization
- **Best Practices**:
  - Implement proper namespace organization for translations
  - Use ICU message format for complex pluralization
  - Implement RTL (Right-to-Left) language support
  - Use lazy loading for translation files
  - Implement proper fallback language chains
  - Support dynamic language switching
  - Handle date, number, and currency formatting per locale
  - Implement proper font support for various scripts

## Push Notifications

### Expo Notifications

- **Purpose**: Push notifications for engagement and updates
- **Best Practices**:
  - Implement proper permission handling
  - Use notification channels for Android
  - Implement deep linking from notifications
  - Handle notification scheduling for reading reminders
  - Implement proper notification analytics
  - Support rich notifications with images/actions
  - Handle notification badges and counts
  - Implement quiet hours and user preferences
