# Multilingual Audio Bible App

A React Native application designed to provide offline-first access to audio Bible content in multiple languages, with real-time synchronization and global accessibility features.

## 🌟 Features

- **Offline-First Architecture**: Complete functionality without internet connection
- **Multi-Language Support**: Support for hundreds of languages with proper RTL handling
- **Audio Playback**: High-quality audio Bible content with background playback
- **Real-time Sync**: PowerSync integration for seamless data synchronization
- **Global Accessibility**: Designed for users with disabilities and older Android devices
- **Cross-Platform**: Native iOS and Android applications

## 🏗️ Tech Stack

- **Framework**: React Native (New Architecture) with Expo Bare Workflow
- **Database**: SQLite + Drizzle ORM with PowerSync sync
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Storage**: Backblaze B2 for audio files
- **State Management**: Zustand + TanStack Query
- **UI**: Tamagui design system
- **Audio**: Expo Audio with background playback
- **Analytics**: PostHog + Sentry
- **Internationalization**: i18next with React Native Localize

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- Yarn package manager
- Xcode (for iOS development)
- Android Studio (for Android development)
- Expo CLI and EAS CLI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/el-bible-react.git
cd el-bible-react
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
yarn start
```

## 📱 Development

### Running the App

- **iOS**: `yarn ios`
- **Android**: `yarn android`
- **Web** (for testing): `yarn web`

### Testing

- **Unit Tests**: `yarn test`
- **E2E Tests**: `yarn test:e2e`
- **Type Check**: `yarn type-check`
- **Lint**: `yarn lint`

### Building

- **Development Build**: `eas build --profile development`
- **Preview Build**: `eas build --profile preview`
- **Production Build**: `eas build --profile production`

## 📋 Project Structure

```
src/
├── components/         # Reusable UI components
├── screens/           # Screen components
├── navigation/        # Navigation configuration
├── services/          # API and external services
├── store/             # Zustand stores
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
├── types/             # TypeScript type definitions
├── constants/         # App constants
├── assets/            # Images, fonts, etc.
└── locales/           # Translation files
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

- **Supabase**: Database and authentication
- **Backblaze B2**: File storage
- **PostHog**: Analytics
- **Sentry**: Error monitoring
- **PowerSync**: Real-time sync

### Development Setup

See [Project Setup Checklist](docs/planning/project-setup-checklist.md) for detailed setup instructions.

## 🧪 Testing Strategy

- **Unit Testing**: Jest + React Native Testing Library (80% coverage target)
- **Integration Testing**: Component and service integration tests
- **E2E Testing**: Detox for critical user journeys
- **Performance Testing**: Custom metrics and monitoring

See [Testing Guidelines](docs/guidelines/testing.md) for details.

## 🚀 CI/CD

- **CI Pipeline**: GitHub Actions with automated testing and quality checks
- **Staging Deployment**: Automated deployment to TestFlight/Internal Testing
- **Production Deployment**: Gradual rollout with monitoring

See [CI/CD Guidelines](docs/guidelines/ci-cd.md) for details.

## 📖 Documentation

- [Technology Stack](docs/guidelines/tech-stack.md)
- [Testing Strategy](docs/guidelines/testing.md)
- [CI/CD Pipeline](docs/guidelines/ci-cd.md)
- [Project Setup Checklist](docs/planning/project-setup-checklist.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Run the test suite: `yarn test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bible translation organizations for providing audio content
- Open source community for the excellent tooling
- Contributors and maintainers

## 📞 Support

For support and questions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for global Bible accessibility** 