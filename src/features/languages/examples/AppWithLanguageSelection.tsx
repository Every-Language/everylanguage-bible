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
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/shared/context/ThemeContext';
import { useTranslations } from '@/shared/context/LocalizationContext';

type Tab = 'Bible' | 'Playlists';

const MainContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<Tab>('Bible');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleProfilePress = () => {
    setShowProfileModal(true);
  };

  const handleSyncPress = () => {
    console.log('Sync pressed - you could trigger a manual sync here');
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Bible':
        return <BibleContainerScreen />;
      case 'Playlists':
        return <PlaylistsScreen />;
      default:
        return <BibleContainerScreen />;
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 
        UPDATED: Added showLanguageSelection={true} to enable language selection buttons!
        This will add Audio and Text version selector buttons to the TopBar
      */}
      <TopBar
        title={
          activeTab === 'Bible'
            ? t('navigation.bible')
            : t('navigation.playlists')
        }
        showProfile={true}
        showThemeToggle={true}
        showSyncStatus={true}
        showLanguageSelection={true} // 🎉 This enables the language selection buttons!
        onProfilePress={handleProfilePress}
        onSyncPress={handleSyncPress}
      />

      {renderContent()}

      {/* Navigation tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Bible' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('Bible')}>
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'Bible'
                    ? theme.colors.onPrimary
                    : theme.colors.text,
              },
            ]}>
            {t('navigation.bible')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Playlists' && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setActiveTab('Playlists')}>
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'Playlists'
                    ? theme.colors.onPrimary
                    : theme.colors.text,
              },
            ]}>
            {t('navigation.playlists')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Modal */}
      <SlideUpModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}>
        <ProfileScreen onClose={() => setShowProfileModal(false)} />
      </SlideUpModal>

      {/* Media Player Sheet */}
      <MediaPlayerSheet />
    </View>
  );
};

export const AppWithLanguageSelection: React.FC = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.gestureContainer}>
        <ThemeProvider>
          <LocalizationProvider>
            <SyncProvider>
              <MediaPlayerProvider>
                <AuthProvider>
                  <StatusBar style='auto' />
                  <MainContent />
                </AuthProvider>
              </MediaPlayerProvider>
            </SyncProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  gestureContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
