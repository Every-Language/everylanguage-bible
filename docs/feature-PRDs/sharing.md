# Sharing Feature PRD

## Overview

Native sharing system that enables users to share any content (verses, passages, chapters, playlists, or the app itself) through device share sheets with intelligent deep linking and comprehensive share tracking.

## Goals

- Enable effortless sharing of Bible content through native device share mechanisms
- Provide seamless experience for recipients regardless of app installation status
- Track sharing patterns to understand content virality and user engagement
- Support share chain analysis to measure content distribution effectiveness
- Maintain privacy while gathering meaningful analytics on sharing behavior

## Key Features

### 1. Universal Content Sharing

- **Verse/Passage Sharing**:
  - Single verse or verse range sharing
  - Automatic text formatting with reference
  - Include translation and language information
- **Chapter Sharing**:
  - Full chapter sharing with audio availability indication
  - Chapter summary and key verse highlights
  - Multiple format options (audio link, text, or both)
- **Playlist Sharing**:
  - Complete playlist with all items and subheadings
  - Preview of first few items
  - Creator attribution and description
- **App Sharing**:
  - General app invitation with personalized message
  - Include user's language and popular content in their region
  - Missionary-focused sharing with regional customization

### 2. Native Share Sheet Integration

- **Platform Integration**:
  - iOS: Native UIActivityViewController integration
  - Android: Native Intent.ACTION_SEND support
  - Automatic detection of available sharing apps
  - Respect user's preferred sharing apps

### 3. Deep Linking & Smart Routing

- **Universal Link Structure**:
  ```
  https://biblex.app/share/[content-type]/[content-id]?ref=[share-id]
  ```
- **Content-Specific Links**:
  - Verse: `/share/verse/john.3.16?lang=en&trans=niv&ref=abc123`
  - Chapter: `/share/chapter/john.3?lang=en&trans=niv&ref=abc123`
  - Playlist: `/share/playlist/hope-series?ref=abc123`
  - App: `/share/app?lang=en&region=np&ref=abc123`
- **Smart App Detection**:
  - Detect if recipient has app installed
  - Route appropriately based on installation status
  - Progressive fallback for unsupported deep link scenarios

### 4. Recipient Experience Management

- **App Not Installed Flow**:
  1. Open web preview with shared content
  2. Display app download buttons (App Store/Play Store)
  3. Store share reference for post-install attribution
  4. Redirect to shared content upon first app launch
- **App Installed Flow**:
  1. Direct deep link to shared content

### 5. Share Chain Tracking & Analytics

- **Share Event Tracking**:
  - Share creation with content metadata
  - Share method (WhatsApp, SMS, email, etc.)
  - Geographic and temporal context
  - Sharer's engagement with the content
- **Receive Event Tracking**:
  - Link clicks and app opens
  - Content engagement after receiving share
  - Conversion from share to regular app usage
  - Share chain propagation tracking
- **Viral Analytics**:
  - Share-to-install conversion rates
  - Content virality scoring
  - Geographic spread mapping
  - Share chain depth and branching analysis

### Web Preview System

- **Progressive Web App**: Lightweight PWA for content preview
- **Server-Side Rendering**: Pre-render content for optimal link previews
- **Smart App Store Redirects**: Intelligent routing to appropriate app store
- **Offline Capability**: Basic content viewing even when offline

## User Experience

### Sharing Flow

1. **Content Selection**: User selects content to share from any screen
2. **Share Trigger**: Tap share button or use share gesture
3. **Native Sheet**: System share sheet appears with available apps
4. **Method Selection**: User chooses sharing method (WhatsApp, SMS, etc.)
5. **Message Customization**: Option to add personal message
6. **Send Confirmation**: Brief confirmation of successful share

### Recipient Experience

1. **Link Click**: Recipient taps shared link
2. **Smart Detection**: System detects app installation status
3. **Appropriate Routing**:
   - If app installed: Open directly to content
   - If not installed: Web preview with download option
4. **Content Display**: Show shared content with context

## Future Enhancements

- **Rich Media Sharing**: Include audio snippets and visual content in shares
- **Content Adaptation**:
  - WhatsApp: Optimized text format with link preview
  - Instagram: Text-friendly format for stories
  - SMS: Concise format with essential information
  - Email: Rich formatted content with images
  - Generic sharing: Fallback format for any app
