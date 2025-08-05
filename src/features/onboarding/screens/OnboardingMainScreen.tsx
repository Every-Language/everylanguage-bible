import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useLocalization } from '@/shared/hooks';
import { DatabaseStatusCard } from '../components/DatabaseStatusCard';
import { OnboardingCard } from '../components/OnboardingCard';
import { useDatabaseStatus } from '../hooks/useDatabaseStatus';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';

interface OnboardingMainScreenProps {
  onNavigateToOnlineBibleSetup: () => void;
  onNavigateToOfflineBibleSetup: () => void;
  onComplete: () => void;
}

export const OnboardingMainScreen: React.FC<OnboardingMainScreenProps> = ({
  onNavigateToOnlineBibleSetup,
  onNavigateToOfflineBibleSetup,
}) => {
  const { theme, mode, toggleTheme } = useTheme();
  const { currentLocale, changeLocale, supportedLocales, t } =
    useLocalization();
  const { databaseStatus, databaseProgress, error, handleRetryDatabase } =
    useDatabaseStatus();

  // State for language selector modal
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const [showDatabaseCard, setShowDatabaseCard] = useState(false);

  useEffect(() => {
    if (databaseStatus === 'ready') {
      // Show import cards when database is ready
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
    } else if (databaseStatus === 'error') {
      // Show database card only when there's an error
      setShowDatabaseCard(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    } else {
      // Database is loading, show import cards with loading state
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
    }
  }, [databaseStatus, fadeAnim, slideAnim]);

  const canProceed = databaseStatus !== 'error';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Compact Header with Controls */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
            ellipsizeMode='tail'>
            EL BIBLE
          </Text>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={() => setShowLanguageModal(true)}>
              <Ionicons name='language' size={18} color={theme.colors.text} />
              <Text style={[styles.controlText, { color: theme.colors.text }]}>
                {supportedLocales.find(locale => locale.code === currentLocale)
                  ?.nativeName || 'EN'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={toggleTheme}>
              <Ionicons
                name={mode === 'light' ? 'moon' : 'sunny'}
                size={18}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Database Status Card */}
        {showDatabaseCard && (
          <View style={styles.databaseCardContainer}>
            <DatabaseStatusCard
              status={databaseStatus}
              progress={databaseProgress}
              error={error}
              onRetry={handleRetryDatabase}
            />
          </View>
        )}

        {/* Main Setup Cards */}
        {canProceed && (
          <View style={styles.cardsSection}>
            {/* App Description */}
            <View style={styles.appDescriptionContainer}>
              <Text
                style={[
                  styles.appDescription,
                  { color: theme.colors.textSecondary },
                ]}>
                {t('onboarding.welcome')}{' '}
                <Text
                  style={[
                    styles.brandName,
                    { color: theme.colors.accent + 'CC' },
                  ]}>
                  EL BIBLE
                </Text>
                ! {t('onboarding.description')}
              </Text>
            </View>
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('onboarding.setupChoice')}
            </Text>

            {/* Online Bible Setup Card */}
            <Animated.View
              style={[
                styles.cardContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}>
              <OnboardingCard
                icon='🌐'
                title={t('onboarding.onlineSetup.title')}
                description={t('onboarding.onlineSetup.description')}
                backgroundColor={theme.colors.primary}
                onPress={onNavigateToOnlineBibleSetup}
              />
            </Animated.View>

            {/* Offline Bible Setup Card */}
            <Animated.View
              style={[
                styles.cardContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}>
              <OnboardingCard
                icon='📁'
                title={t('onboarding.offlineSetup.title')}
                description={t('onboarding.offlineSetup.description')}
                backgroundColor={theme.colors.secondary}
                onPress={onNavigateToOfflineBibleSetup}
              />
            </Animated.View>

            {/* Setup Information Message */}
            <View style={styles.setupInfoContainer}>
              <Text
                style={[
                  styles.setupInfoText,
                  { color: theme.colors.textSecondary },
                ]}>
                {t('onboarding.setupInfo')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.colors.background },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('onboarding.selectLanguage')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.closeButton}>
                <Ionicons name='close' size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.languageGrid}>
              {supportedLocales.map(locale => (
                <TouchableOpacity
                  key={locale.code}
                  style={[
                    styles.languageItem,
                    {
                      backgroundColor:
                        currentLocale === locale.code
                          ? theme.colors.primary
                          : theme.colors.surface,
                    },
                  ]}
                  onPress={() => {
                    changeLocale(locale.code);
                    setShowLanguageModal(false);
                  }}>
                  <Text
                    style={[
                      styles.languageName,
                      {
                        color:
                          currentLocale === locale.code
                            ? theme.colors.textInverse
                            : theme.colors.text,
                      },
                    ]}>
                    {locale.nativeName}
                  </Text>
                  <Text
                    style={[
                      styles.languageCode,
                      {
                        color:
                          currentLocale === locale.code
                            ? theme.colors.textInverse + '80'
                            : theme.colors.textSecondary,
                      },
                    ]}>
                    {locale.name}
                  </Text>
                  {currentLocale === locale.code && (
                    <Ionicons
                      name='checkmark'
                      size={16}
                      color={theme.colors.textInverse}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
    marginRight: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  controlText: {
    fontSize: 13,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  appDescriptionContainer: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  brandName: {
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  databaseCardContainer: {
    marginBottom: 24,
  },
  cardsSection: {
    flex: 1,
    gap: 16,
  },
  cardContainer: {
    width: '100%',
  },
  setupInfoContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  setupInfoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLOR_VARIATIONS.BLACK_50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: COLOR_VARIATIONS.SHADOW_BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  languageItem: {
    width: '45%',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 60,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  languageCode: {
    fontSize: 11,
    textAlign: 'center',
  },
});
