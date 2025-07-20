import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/shared/context/ThemeContext';
import { LocalizationProvider } from '@/shared/context/LocalizationContext';
import { SyncProvider } from '@/shared/context/SyncContext';
import { MediaPlayerProvider } from '@/shared/context/MediaPlayerContext';
import { AuthProvider } from '@/features/auth';
import { HomeScreen } from '@/features/home';
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseManager from '@/shared/services/database/DatabaseManager';

const ONBOARDING_STORAGE_KEY = '@bible_app_onboarding';

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
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize database first
      console.log('App: Initializing database...');
      const databaseManager = DatabaseManager.getInstance();
      await databaseManager.initialize();
      console.log('App: Database initialized successfully');

      // Check onboarding status
      await checkOnboardingStatus();
    } catch (error) {
      console.error('App: Failed to initialize:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to initialize app'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const onboardingState = JSON.parse(stored);
        setShowOnboarding(!onboardingState.isCompleted);
      } else {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleRetry = () => {
    setError(null);
    initializeApp();
  };

  // Development helper: Reset onboarding (remove in production)
  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setShowOnboarding(true);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
        }}>
        <ActivityIndicator size='large' color='#007AFF' />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Initializing Bible App...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          padding: 20,
        }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
            marginBottom: 8,
          }}>
          Initialization Failed
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            marginBottom: 20,
          }}>
          {error}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: '#007AFF',
            textDecorationLine: 'underline',
          }}
          onPress={handleRetry}>
          Retry
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#999',
            marginTop: 20,
            textDecorationLine: 'underline',
          }}
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
          <SyncProvider>
            <AuthProvider>
              <MediaPlayerProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <StatusBarWrapper />
                  <MainContent />
                </GestureHandlerRootView>
              </MediaPlayerProvider>
            </AuthProvider>
          </SyncProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </SafeAreaProvider>
  );
};

export default App;
