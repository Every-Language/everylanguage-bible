import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from '@/shared/hooks/useThemeFromStore';
import { useOnboardingStore } from '@/shared/store/onboardingStore';
import { useAuthStore } from '@/shared/store/authStore';
import { useLocalizationStore } from '@/shared/store/localizationStore';
import { useThemeStore } from '@/shared/store/themeStore';
import { initializeAllStores } from '@/shared/store';
import { permissionsService } from '@/shared/services/permissions/PermissionsService';
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { logger } from '@/shared/utils/logger';
import { queryClient } from '@/shared/services/query/queryClient';

const StatusBarWrapper: React.FC = () => {
  const { theme } = useTheme();

  return (
    <StatusBar
      style={theme.mode === 'dark' ? 'light' : 'dark'}
      backgroundColor={theme.colors.background}
    />
  );
};

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const { showOnboarding, isLoading: isOnboardingLoading } =
    useOnboardingStore();
  const { isLoading: isAuthLoading, isInitialized: isAuthInitialized } =
    useAuthStore();
  const { isLoading: isLocalizationLoading } = useLocalizationStore();
  const { isLoading: isThemeLoading } = useThemeStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [, setPermissionsGranted] = useState(false);

  // Initialize all stores on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);

        // Initialize all Zustand stores
        await initializeAllStores();

        // Request permissions
        await permissionsService.requestAllPermissions();
        setPermissionsGranted(
          permissionsService.areCriticalPermissionsGranted()
        );

        logger.info('App initialization completed');
      } catch (error) {
        logger.error('Failed to initialize app:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen while initializing
  if (
    isInitializing ||
    isOnboardingLoading ||
    isAuthLoading ||
    isLocalizationLoading ||
    isThemeLoading ||
    !isAuthInitialized
  ) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <Text
          style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <StatusBarWrapper />
            <OnboardingScreen
              onComplete={() => {
                const onboardingStore = useOnboardingStore.getState();
                onboardingStore.completeOnboarding();
              }}
            />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // Show main app
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <StatusBarWrapper />
          <HomeScreen />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default App;
