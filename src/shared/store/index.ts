export {
  useOnboardingStore,
  type OnboardingStore,
  type OnboardingState,
  type OnboardingActions,
} from './onboardingStore';

export {
  useThemeStore,
  initializeThemeStore,
  type ThemeStore,
  type ThemeState,
  type ThemeActions,
} from './themeStore';

export {
  useLocalizationStore,
  initializeLocalizationStore,
  type LocalizationStore,
  type LocalizationState,
  type LocalizationActions,
} from './localizationStore';

export {
  useAuthStore,
  initializeAuthStore,
  type AuthStore,
  type AuthStoreState,
  type AuthStoreActions,
} from './authStore';

export {
  useSyncStore,
  initializeSyncStore,
  type SyncStore,
  type SyncState,
} from './syncStore';

export {
  useMediaPlayerStore,
  type MediaPlayerStore,
  type MediaPlayerState,
  type MediaPlayerActions,
  type MediaTrack,
} from './mediaPlayerStore';

export { useNetworkStore } from './networkStore';
export type { NetworkStore, NetworkCapabilities } from './networkStore';

// Initialize all stores
export const initializeAllStores = async () => {
  try {
    // Import the initialization functions
    const { initializeThemeStore } = await import('./themeStore');
    const { initializeLocalizationStore } = await import('./localizationStore');
    const { initializeAuthStore } = await import('./authStore');
    const { initializeSyncStore } = await import('./syncStore');
    const { useOnboardingStore } = await import('./onboardingStore');
    const { useNetworkStore } = await import('./networkStore');

    // Initialize stores that need async setup
    await initializeThemeStore();
    await initializeLocalizationStore();
    await initializeAuthStore();
    await initializeSyncStore();

    // Initialize network store
    const networkStore = useNetworkStore.getState();
    await networkStore.initialize();

    // Initialize onboarding store
    const onboardingStore = useOnboardingStore.getState();
    await onboardingStore.checkOnboardingStatus();
  } catch (error) {
    // Use logger instead of console
    const { logger } = await import('../utils/logger');
    logger.error('Failed to initialize stores:', error);
  }
};
