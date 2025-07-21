import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import DatabaseManager, {
  DatabaseInitProgress,
} from '@/shared/services/database/DatabaseManager';

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
  const [databaseStatus, setDatabaseStatus] = useState<
    'checking' | 'ready' | 'error' | 'initializing'
  >('checking');
  const [databaseProgress, setDatabaseProgress] =
    useState<DatabaseInitProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const [showDatabaseCard, setShowDatabaseCard] = useState(true);

  // Helper function to determine text color based on background color
  const getContrastTextColor = (backgroundColor: string) => {
    // Convert hex to RGB and calculate luminance
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return dark text for light backgrounds, light text for dark backgrounds
    return luminance > 0.5 ? theme.colors.text : theme.colors.textInverse;
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

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
  }, [databaseStatus]);

  const checkDatabaseStatus = async () => {
    try {
      console.log('OnboardingMainScreen: Starting database status check');
      setDatabaseStatus('checking');
      setError(null);

      const databaseManager = DatabaseManager.getInstance();

      // Check if database is already initialized
      if (databaseManager.isReady()) {
        console.log('OnboardingMainScreen: Database is already ready');
        setDatabaseStatus('ready');
        return;
      }

      // Check if database is currently being initialized (by SyncContext)
      if (databaseManager.initialized) {
        console.log(
          'OnboardingMainScreen: Database is being initialized by SyncContext, waiting...'
        );
        // Wait a bit for the initialization to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        if (databaseManager.isReady()) {
          console.log(
            'OnboardingMainScreen: Database is now ready after waiting'
          );
          setDatabaseStatus('ready');
          return;
        }
      }

      // Initialize database if not ready
      console.log('OnboardingMainScreen: Initializing database');
      setDatabaseStatus('initializing');

      databaseManager.setProgressCallback((progress: DatabaseInitProgress) => {
        console.log('OnboardingMainScreen: Database progress:', progress);
        setDatabaseProgress(progress);

        if (progress.stage === 'complete') {
          setDatabaseStatus('ready');
        } else if (progress.stage === 'error') {
          setDatabaseStatus('error');
          setError(progress.error || 'Database initialization failed');
        }
      });

      await databaseManager.initialize();

      // Verify database is working
      await verifyDatabase();
    } catch (err) {
      console.error('OnboardingMainScreen: Database check failed:', err);
      setDatabaseStatus('error');
      setError(
        err instanceof Error ? err.message : 'Database verification failed'
      );
    }
  };

  const verifyDatabase = async () => {
    try {
      console.log('OnboardingMainScreen: Verifying database functionality');
      const databaseManager = DatabaseManager.getInstance();

      // Test a simple query to ensure database is working
      const result = await databaseManager.executeSingleQuery<{
        count: number;
      }>('SELECT COUNT(*) as count FROM sync_metadata');

      if (!result || result.count === undefined) {
        throw new Error('Database verification failed');
      }

      console.log(
        'OnboardingMainScreen: Database verification successful, count:',
        result.count
      );
    } catch (err) {
      console.error('OnboardingMainScreen: Database verification failed:', err);
      throw new Error(
        'Database verification failed: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  const handleRetryDatabase = () => {
    checkDatabaseStatus();
  };

  const renderDatabaseStatus = () => {
    switch (databaseStatus) {
      case 'checking':
        return (
          <View
            style={[
              styles.databaseCard,
              { backgroundColor: theme.colors.surface },
            ]}>
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>🔍</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Checking Database
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  { color: theme.colors.textSecondary },
                ]}>
                Verifying your Bible app database...
              </Text>
            </View>
            <ActivityIndicator size='small' color={theme.colors.primary} />
          </View>
        );

      case 'initializing':
        return (
          <View
            style={[
              styles.databaseCard,
              { backgroundColor: theme.colors.surface },
            ]}>
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>⚙️</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Initializing Database
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  { color: theme.colors.textSecondary },
                ]}>
                {databaseProgress?.message || 'Setting up your Bible app...'}
              </Text>
              {databaseProgress && (
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: theme.colors.border },
                    ]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: theme.colors.primary,
                          width: `${databaseProgress.progress}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressText,
                      { color: theme.colors.textSecondary },
                    ]}>
                    {databaseProgress.progress}%
                  </Text>
                </View>
              )}
            </View>
            <ActivityIndicator size='small' color={theme.colors.primary} />
          </View>
        );

      case 'ready':
        return (
          <View
            style={[
              styles.databaseCard,
              { backgroundColor: theme.colors.surface },
            ]}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: theme.colors.success + '20' },
              ]}>
              <Text style={styles.iconText}>✅</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Database Ready
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  { color: theme.colors.textSecondary },
                ]}>
                Your Bible app database is ready to use
              </Text>
            </View>
            <View
              style={[
                styles.statusIcon,
                { backgroundColor: theme.colors.success },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  { color: theme.colors.textInverse },
                ]}>
                ✓
              </Text>
            </View>
          </View>
        );

      case 'error':
        return (
          <View
            style={[
              styles.databaseCard,
              { backgroundColor: theme.colors.surface },
            ]}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: theme.colors.error + '20' },
              ]}>
              <Text style={styles.iconText}>❌</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Database Error
              </Text>
              <Text
                style={[styles.cardDescription, { color: theme.colors.error }]}>
                {error || 'Failed to initialize database'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleRetryDatabase}>
              <Text
                style={[styles.retryText, { color: theme.colors.textInverse }]}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

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
        {showDatabaseCard && renderDatabaseStatus()}

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
            styles.card,
            styles.languageCard,
            {
              backgroundColor: theme.colors.primary,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <TouchableOpacity
            style={styles.cardTouchable}
            onPress={canProceed ? onNavigateToMotherTongue : undefined}
            disabled={!canProceed}>
            <View
              style={[
                styles.cardIcon,
                {
                  backgroundColor:
                    getContrastTextColor(theme.colors.primary) ===
                    theme.colors.text
                      ? 'rgba(0, 0, 0, 0.1)'
                      : 'rgba(255, 255, 255, 0.2)',
                },
              ]}>
              <Text style={styles.iconText}>🌍</Text>
            </View>
            <View style={styles.cardContent}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: getContrastTextColor(theme.colors.primary) },
                ]}>
                Choose Your Language
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  {
                    color: getContrastTextColor(theme.colors.primary),
                    opacity: 0.9,
                  },
                ]}>
                Download the bible in your mother tongue or any other language.
                Internet is required.
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Import Bible Content Card */}
        <Animated.View
          style={[
            styles.card,
            styles.importCard,
            {
              backgroundColor: theme.colors.secondary,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <TouchableOpacity
            style={styles.cardTouchable}
            onPress={canProceed ? onNavigateToImportBible : undefined}
            disabled={!canProceed}>
            <View
              style={[
                styles.cardIcon,
                {
                  backgroundColor:
                    getContrastTextColor(theme.colors.secondary) ===
                    theme.colors.text
                      ? 'rgba(0, 0, 0, 0.1)'
                      : 'rgba(255, 255, 255, 0.2)',
                },
              ]}>
              <Text style={styles.iconText}>📖</Text>
            </View>
            <View style={styles.cardContent}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: getContrastTextColor(theme.colors.secondary) },
                ]}>
                Import Bible Content
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  {
                    color: getContrastTextColor(theme.colors.secondary),
                    opacity: 0.9,
                  },
                ]}>
                Import bible from your phone or sd card. Internet is not
                required.
              </Text>
            </View>
          </TouchableOpacity>
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
  databaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 100,
  },
  languageCard: {
    // Background color is now set dynamically using theme.colors.primary
  },
  importCard: {
    // Background color is now set dynamically using theme.colors.secondary
  },
  cardTouchable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    marginTop: 2,
    flexShrink: 0,
  },
  // Icon backgrounds are now set dynamically based on contrast
  iconText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  progressContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 30,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Arrow styles removed - no longer using arrow icons
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
