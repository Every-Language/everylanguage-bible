import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { DatabaseStatusCard } from '../components/DatabaseStatusCard';
import { OnboardingCard } from '../components/OnboardingCard';
import { useDatabaseStatus } from '../hooks/useDatabaseStatus';

interface OnboardingMainScreenProps {
  onNavigateToMotherTongue: () => void;
  onNavigateToImportBible: () => void;
  onComplete: () => void;
}

export const OnboardingMainScreen: React.FC<OnboardingMainScreenProps> = ({
  onNavigateToMotherTongue,
  onNavigateToImportBible,
}) => {
  const { theme } = useTheme();
  const { databaseStatus, databaseProgress, error, handleRetryDatabase } =
    useDatabaseStatus();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const [showDatabaseCard, setShowDatabaseCard] = useState(true);

  useEffect(() => {
    if (databaseStatus === 'ready') {
      // Hide database card and animate in other cards
      setTimeout(() => {
        setShowDatabaseCard(false);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }, 500);
    } else {
      // Reset animations when database is not ready
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setShowDatabaseCard(true);
    }
  }, [databaseStatus, fadeAnim, slideAnim]);

  const canProceed = databaseStatus === 'ready';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Welcome to Bible App
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Let&apos;s set up your personalized Bible experience
        </Text>
      </View>

      <View
        style={[styles.content, !showDatabaseCard && styles.contentCentered]}>
        {/* Database Status Card */}
        {showDatabaseCard && (
          <DatabaseStatusCard
            status={databaseStatus}
            progress={databaseProgress}
            error={error}
            onRetry={handleRetryDatabase}
          />
        )}

        {/* Loading message when database is not ready */}
        {databaseStatus !== 'ready' && (
          <Animated.View
            style={[
              styles.loadingMessage,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}>
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.textSecondary },
              ]}>
              Please wait while we prepare your Bible app...
            </Text>
          </Animated.View>
        )}

        {/* Language Selection Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <OnboardingCard
            icon='🌍'
            title='Choose Your Language'
            description='Download the bible in your mother tongue or any other language. Internet is required.'
            backgroundColor={theme.colors.primary}
            onPress={canProceed ? onNavigateToMotherTongue : undefined}
            disabled={!canProceed}
          />
        </Animated.View>

        {/* Import Bible Content Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <OnboardingCard
            icon='📖'
            title='Import Bible Content'
            description='Import bible from your phone or sd card. Internet is not required.'
            backgroundColor={theme.colors.secondary}
            onPress={canProceed ? onNavigateToImportBible : undefined}
            disabled={!canProceed}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  contentCentered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
  },
  loadingMessage: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
