import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { TopBar } from '@/shared/components/TopBar';
import { SlideUpModal } from '@/shared/components/ui/SlideUpModal';
import { MediaPlayerSheet } from '@/features/media/components/MediaPlayerSheet';
import { VersionSelectionModal } from '@/features/languages/components';
import { AuthScreen, ProfileScreen } from '@/features/auth';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useCurrentVersions,
  useSavedVersions,
} from '@/features/languages/hooks';
import { AudioVersion, TextVersion } from '@/features/languages/types';
import { HomeTabNavigator, HomeContainer } from '../components';
import { useHomeNavigation } from '../hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export const HomeScreen: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const { activeTab, switchTab } = useHomeNavigation('Bible');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAudioVersionModal, setShowAudioVersionModal] = useState(false);
  const [showTextVersionModal, setShowTextVersionModal] = useState(false);

  // Language selection hooks
  const { currentAudioVersion, currentTextVersion } = useCurrentVersions();
  const { savedAudioVersions, savedTextVersions } = useSavedVersions();

  const handleProfilePress = () => {
    setShowProfileModal(true);
  };

  const handleModalClose = () => {
    setShowProfileModal(false);
  };

  // Language selection handlers
  const handleAudioVersionPress = () => {
    setShowAudioVersionModal(true);
  };

  const handleTextVersionPress = () => {
    setShowTextVersionModal(true);
  };

  const handleAudioVersionSelect = (version: AudioVersion | TextVersion) => {
    console.log('Selected audio version:', version);
    setShowAudioVersionModal(false);
  };

  const handleTextVersionSelect = (version: AudioVersion | TextVersion) => {
    console.log('Selected text version:', version);
    setShowTextVersionModal(false);
  };

  // Development helper: Reset onboarding
  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('@bible_app_onboarding');
      console.log('Onboarding reset successfully');
      // You could add a toast or alert here
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Main App Content */}
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}>
        <TopBar
          showLanguageSelection={true}
          onProfilePress={handleProfilePress}
          onAudioVersionPress={handleAudioVersionPress}
          onTextVersionPress={handleTextVersionPress}
        />

        <HomeTabNavigator activeTab={activeTab} onTabPress={switchTab} />

        <HomeContainer activeTab={activeTab} />

        {/* Media Player Sheet */}
        <MediaPlayerSheet />

        {/* Development Reset Button - Remove in production */}
        <TouchableOpacity
          style={[
            styles.resetButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={resetOnboarding}>
          <Text
            style={[
              styles.resetButtonText,
              { color: theme.colors.textInverse },
            ]}>
            Reset Onboarding
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile/Auth Modal */}
      <SlideUpModal visible={showProfileModal} onClose={handleModalClose}>
        {user ? <ProfileScreen onClose={handleModalClose} /> : <AuthScreen />}
      </SlideUpModal>

      {/* Language Selection Modals */}
      <VersionSelectionModal
        visible={showAudioVersionModal}
        onClose={() => setShowAudioVersionModal(false)}
        versionType='audio'
        savedVersions={savedAudioVersions}
        currentVersion={currentAudioVersion}
        onVersionSelect={handleAudioVersionSelect}
        title='Select Audio Version'
      />

      <VersionSelectionModal
        visible={showTextVersionModal}
        onClose={() => setShowTextVersionModal(false)}
        versionType='text'
        savedVersions={savedTextVersions}
        currentVersion={currentTextVersion}
        onVersionSelect={handleTextVersionSelect}
        title='Select Text Version'
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
