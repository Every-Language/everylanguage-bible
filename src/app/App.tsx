import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/shared/context/ThemeContext';
import { LocalizationProvider } from '@/shared/context/LocalizationContext';
import { SyncProvider, useSync } from '@/shared/context/SyncContext';
import { MediaPlayerProvider } from '@/shared/context/MediaPlayerContext';
import {
  OnboardingProvider,
  useOnboarding,
} from '@/shared/context/OnboardingContext';
import { AuthProvider } from '@/features/auth';
import { HomeScreen } from '@/features/home';
import { logger } from '@/shared/utils/logger';
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';

const StatusBarWrapper: React.FC = () => {
  const { theme } = useTheme();

  return (
    <StatusBar
      barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
      backgroundColor={theme.colors.background}
    />
  );
};

const MainContent: React.FC = () => {
  const { theme } = useTheme();
  const {
    showOnboarding,
    checkOnboardingStatus,
    completeOnboarding,
    resetOnboarding,
  } = useOnboarding();
  const { setOnboardingMode } = useSync();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeApp = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check onboarding status first
      await checkOnboardingStatus();
    } catch (error) {
      logger.error('App: Failed to initialize:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to initialize app'
      );
    } finally {
      setIsLoading(false);
    }
  }, [checkOnboardingStatus]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleOnboardingComplete = async () => {
    // Disable onboarding mode to allow normal sync behavior
    setOnboardingMode(false);
    await completeOnboarding();
  };

  const handleRetry = () => {
    setError(null);
    initializeApp();
  };

  // Set onboarding mode when showing onboarding
  useEffect(() => {
    if (showOnboarding !== null) {
      setOnboardingMode(showOnboarding);
    }
  }, [showOnboarding, setOnboardingMode]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <Text
          style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading Bible App...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
          Initialization Failed
        </Text>
        <Text
          style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
          {error}
        </Text>
        <Text
          style={[styles.retryButton, { color: theme.colors.primary }]}
          onPress={handleRetry}>
          Retry
        </Text>
        <Text
          style={[styles.resetButton, { color: theme.colors.textSecondary }]}
          onPress={resetOnboarding}>
          Reset Onboarding (Dev)
        </Text>
      </View>
    );
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Show main app
  return <HomeScreen />;
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <LocalizationProvider>
        <ThemeProvider>
          <OnboardingProvider>
            <SyncProvider>
              <AuthProvider>
                <MediaPlayerProvider>
                  <GestureHandlerRootView style={styles.gestureHandlerRoot}>
                    <StatusBarWrapper />
                    <MainContent />
                  </GestureHandlerRootView>
                </MediaPlayerProvider>
              </AuthProvider>
            </SyncProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  resetButton: {
    fontSize: 14,
    marginTop: 20,
    textDecorationLine: 'underline',
  },
  gestureHandlerRoot: {
    flex: 1,
  },
});
