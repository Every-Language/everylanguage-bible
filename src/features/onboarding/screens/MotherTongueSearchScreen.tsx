import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import { useNetworkForAction } from '@/shared/hooks/useNetworkState';
import { NoInternetModal, SyncProgressModal } from '@/shared/components';
import { logger } from '@/shared/utils/logger';
import { LanguageHierarchyBrowser } from '@/features/languages/components';
import { useCurrentVersions } from '@/features/languages/hooks';
import {
  AudioVersion,
  TextVersion,
  LanguageEntity,
} from '@/features/languages/types';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';

interface MotherTongueSearchScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export const MotherTongueSearchScreen: React.FC<
  MotherTongueSearchScreenProps
> = ({ onBack, onComplete }) => {
  const { theme } = useTheme();
  const { isOnline, isChecking, ensureNetworkAvailable, retryAndExecute } =
    useNetworkForAction();

  // Language selection state
  const {
    currentAudioVersion,
    currentTextVersion,
    setAudioVersion,
    setTextVersion,
  } = useCurrentVersions();

  // Modal states
  const [showNoInternetModal, setShowNoInternetModal] = useState(false);
  const [showSyncProgressModal, setShowSyncProgressModal] = useState(false);
  const [showAudioVersionBrowser, setShowAudioVersionBrowser] = useState(false);
  const [showTextVersionBrowser, setShowTextVersionBrowser] = useState(false);

  // Debug logging for network state
  useEffect(() => {
    logger.debug('MotherTongueSearchScreen: Network state debug:', {
      isOnline,
      isChecking,
      timestamp: new Date().toISOString(),
    });
  }, [isOnline, isChecking]);

  // Check for internet connectivity when component mounts
  useEffect(() => {
    if (!isOnline && !isChecking) {
      logger.debug(
        'MotherTongueSearchScreen: No internet detected, showing modal'
      );
      setShowNoInternetModal(true);
    } else {
      logger.debug(
        'MotherTongueSearchScreen: Internet available or checking, hiding modal'
      );
      setShowNoInternetModal(false);
    }
  }, [isOnline, isChecking]);

  const handleAudioVersionPress = () => {
    if (!isOnline) {
      setShowNoInternetModal(true);
      return;
    }
    setShowAudioVersionBrowser(true);
  };

  const handleTextVersionPress = () => {
    if (!isOnline) {
      setShowNoInternetModal(true);
      return;
    }
    setShowTextVersionBrowser(true);
  };

  const handleAudioVersionSelect = (
    _version: AudioVersion | TextVersion,
    _type: 'audio' | 'text'
  ) => {
    setAudioVersion(_version as AudioVersion);
    setShowAudioVersionBrowser(false);
  };

  const handleTextVersionSelect = (
    _version: AudioVersion | TextVersion,
    _type: 'audio' | 'text'
  ) => {
    setTextVersion(_version as TextVersion);
    setShowTextVersionBrowser(false);
  };

  const handleLanguageSelect = (_language: LanguageEntity) => {
    // This would be handled by the LanguageHierarchyBrowser
    // We don't need to do anything here as the browser will show available versions
  };

  const handleContinue = async () => {
    if (currentAudioVersion && currentTextVersion) {
      try {
        // Ensure network is available before proceeding
        await ensureNetworkAvailable(() => {
          // Show sync progress modal instead of immediately completing
          setShowSyncProgressModal(true);
        });
      } catch (error) {
        logger.debug(
          'MotherTongueSearchScreen: Network not available for continue action:',
          error
        );
        setShowNoInternetModal(true);
      }
    }
  };

  const handleRetryConnection = async () => {
    try {
      // Use the retry and execute method
      await retryAndExecute(() => {
        setShowNoInternetModal(false);
      });
    } catch (error) {
      logger.debug('MotherTongueSearchScreen: Retry failed:', error);
      // Modal will stay open if retry fails
    }
  };

  const handleGetStarted = () => {
    // Navigate to home screen when sync is complete
    onComplete();
  };

  const canContinue = currentAudioVersion && currentTextVersion;

  const renderVersionCard = (
    type: 'audio' | 'text',
    currentVersion: AudioVersion | TextVersion | null,
    onPress: () => void,
    isSelected: boolean
  ) => {
    const isAudio = type === 'audio';
    const icon = isAudio ? 'volume-high' : 'book';
    const title = isAudio ? 'Audio Version' : 'Text Version';
    const subtitle = isAudio
      ? 'Select your preferred audio Bible'
      : 'Select your preferred text Bible';

    return (
      <TouchableOpacity
        style={[
          styles.versionCard,
          {
            backgroundColor: theme.colors.surface,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}>
            <Ionicons name={icon} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              {title}
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                { color: theme.colors.textSecondary },
              ]}>
              {subtitle}
            </Text>
          </View>
          <View style={styles.cardActions}>
            {isSelected ? (
              <View style={[styles.statusIcon, styles.statusIconSelected]}>
                <MaterialIcons name='check' size={16} color='white' />
              </View>
            ) : (
              <View style={[styles.statusIcon, styles.statusIconUnselected]}>
                <MaterialIcons name='close' size={16} color='white' />
              </View>
            )}
            <Ionicons
              name='chevron-forward'
              size={20}
              color={theme.colors.textSecondary}
            />
          </View>
        </View>

        {currentVersion && (
          <View style={styles.selectedVersionInfo}>
            <Text
              style={[
                styles.selectedVersionName,
                { color: theme.colors.text },
              ]}>
              {currentVersion.name}
            </Text>
            <Text
              style={[
                styles.selectedVersionLanguage,
                { color: theme.colors.textSecondary },
              ]}>
              {currentVersion.languageName}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons
            name='arrow-back'
            size={24}
            color={theme.colors.primary}
            style={styles.backIcon}
          />
          <Text
            style={[styles.backButtonText, { color: theme.colors.primary }]}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Select Your Bible Versions
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Choose your preferred text and audio versions
        </Text>
      </View>

      <View style={styles.content}>
        {/* Network Status Warning */}
        {!isOnline && (
          <View
            style={[
              styles.networkWarning,
              { backgroundColor: theme.colors.error + '20' },
            ]}>
            <MaterialIcons
              name='wifi-off'
              size={20}
              color={theme.colors.error}
            />
            <Text
              style={[
                styles.networkWarningText,
                { color: theme.colors.error },
              ]}>
              Internet connection required to select versions
            </Text>
          </View>
        )}

        {/* Version Selection Cards */}
        <View style={styles.cardsContainer}>
          {renderVersionCard(
            'text',
            currentTextVersion,
            handleTextVersionPress,
            !!currentTextVersion
          )}

          {renderVersionCard(
            'audio',
            currentAudioVersion,
            handleAudioVersionPress,
            !!currentAudioVersion
          )}
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text
            style={[
              styles.progressText,
              { color: theme.colors.textSecondary },
            ]}>
            {currentTextVersion && currentAudioVersion
              ? 'Both versions selected ✓'
              : `${currentTextVersion ? 1 : 0} of 2 versions selected`}
          </Text>
        </View>

        {/* Helpful Comment */}
        <View style={styles.helpTextContainer}>
          <MaterialIcons
            name='info-outline'
            size={16}
            color={theme.colors.textSecondary}
          />
          <Text
            style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            You can change or add other versions later in the app settings
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: canContinue
                ? theme.colors.primary
                : theme.colors.interactiveDisabled,
            },
          ]}
          onPress={handleContinue}
          disabled={!canContinue}>
          <Text
            style={[
              styles.continueButtonText,
              { color: theme.colors.textInverse },
            ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <NoInternetModal
        visible={showNoInternetModal && !isOnline}
        onRetry={handleRetryConnection}
        onClose={() => setShowNoInternetModal(false)}
      />

      <SyncProgressModal
        visible={showSyncProgressModal}
        onClose={() => setShowSyncProgressModal(false)}
        onGetStarted={handleGetStarted}
      />

      {/* Language Hierarchy Browser for Text Versions */}
      <LanguageHierarchyBrowser
        visible={showTextVersionBrowser}
        onClose={() => setShowTextVersionBrowser(false)}
        onLanguageSelect={handleLanguageSelect}
        onVersionSelect={handleTextVersionSelect}
        mode='browse'
        title='Select Text Version'
      />

      {/* Language Hierarchy Browser for Audio Versions */}
      <LanguageHierarchyBrowser
        visible={showAudioVersionBrowser}
        onClose={() => setShowAudioVersionBrowser(false)}
        onLanguageSelect={handleLanguageSelect}
        onVersionSelect={handleAudioVersionSelect}
        mode='browse'
        title='Select Audio Version'
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  backIcon: {
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 10,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  networkWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  networkWarningText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  versionCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: COLOR_VARIATIONS.SHADOW_BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconSelected: {
    backgroundColor: COLOR_VARIATIONS.SUCCESS,
  },
  statusIconUnselected: {
    backgroundColor: COLOR_VARIATIONS.ERROR,
  },
  selectedVersionInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLOR_VARIATIONS.BLACK_10,
  },
  selectedVersionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedVersionLanguage: {
    fontSize: 14,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
  },
  helpTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  continueButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLOR_VARIATIONS.SHADOW_BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
