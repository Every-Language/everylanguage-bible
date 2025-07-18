import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { LocalizationProvider } from '@/shared/context/LocalizationContext';
import { SyncProvider } from '@/shared/context/SyncContext';
import { MediaPlayerProvider } from '@/shared/context/MediaPlayerContext';
import { AuthProvider, AuthScreen, ProfileScreen } from '@/features/auth';
import { BibleContainerScreen } from '@/features/bible';
import { PlaylistsScreen } from '@/features/playlists';
import { TopBar } from '@/shared/components/TopBar';
import { SlideUpModal } from '@/shared/components/ui/SlideUpModal';
import { MediaPlayerSheet } from '@/features/media/components/MediaPlayerSheet';
import { VersionSelectionModal } from '@/features/languages/components';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/shared/context/ThemeContext';
import { useTranslations } from '@/shared/context/LocalizationContext';
import {
  useCurrentVersions,
  useSavedVersions,
} from '@/features/languages/hooks';
import { AudioVersion, TextVersion } from '@/features/languages/types';

type Tab = 'Bible' | 'Playlists';

const MainContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<Tab>('Bible');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Language selection modal state
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

  if (isLoading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      />
    );
  }

  return (
    <>
      {/* Main App Content - will be under the modal */}
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

        {/* Tab Navigation */}
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: theme.colors.background },
          ]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'Bible' && [
                styles.activeTab,
                { backgroundColor: theme.colors.primary },
              ],
            ]}
            onPress={() => setActiveTab('Bible')}>
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'Bible'
                      ? theme.colors.textInverse
                      : theme.colors.textSecondary,
                },
              ]}>
              {t('tabs.bible')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'Playlists' && [
                styles.activeTab,
                { backgroundColor: theme.colors.primary },
              ],
            ]}
            onPress={() => setActiveTab('Playlists')}>
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'Playlists'
                      ? theme.colors.textInverse
                      : theme.colors.textSecondary,
                },
              ]}>
              {t('tabs.playlists')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'Bible' ? (
            <BibleContainerScreen />
          ) : (
            <PlaylistsScreen />
          )}
        </View>

        {/* Media Player Sheet */}
        <MediaPlayerSheet />
      </View>

      {/* Profile/Auth Modal - rendered outside main content to appear on top */}
      <SlideUpModal visible={showProfileModal} onClose={handleModalClose}>
        {user ? <ProfileScreen onClose={handleModalClose} /> : <AuthScreen />}
      </SlideUpModal>

      {/* Language Selection Modals - rendered outside main content to appear on top */}
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
    </>
  );
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
                  <MainContent />
                  <StatusBar style='auto' />
                </GestureHandlerRootView>
              </MediaPlayerProvider>
            </AuthProvider>
          </SyncProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </SafeAreaProvider>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
});

export default App;
