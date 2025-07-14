import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { LocalizationProvider } from '@/shared/context/LocalizationContext';
import { SyncProvider } from '@/shared/context/SyncContext';
import { AuthProvider, AuthScreen, ProfileScreen } from '@/features/auth';
import { BibleBooksScreen } from '@/features/bible/screens/BibleBooksScreen';
import { PlaylistsScreen } from '@/features/playlists';
import { TopBar } from '@/shared/components/TopBar';
import { SlideUpModal } from '@/shared/components/ui/SlideUpModal';
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

  const handleModalClose = () => {
    setShowProfileModal(false);
  };

  if (isLoading) {
    return <View style={[styles.centered, { backgroundColor: theme.colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TopBar onProfilePress={handleProfilePress} />
      
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Bible' && [styles.activeTab, { backgroundColor: theme.colors.primary }]
          ]}
          onPress={() => setActiveTab('Bible')}
        >
                     <Text style={[
             styles.tabText,
             { color: activeTab === 'Bible' ? theme.colors.textInverse : theme.colors.text }
           ]}>
             {t('tabs.bible')}
           </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Playlists' && [styles.activeTab, { backgroundColor: theme.colors.primary }]
          ]}
          onPress={() => setActiveTab('Playlists')}
        >
                     <Text style={[
             styles.tabText,
             { color: activeTab === 'Playlists' ? theme.colors.textInverse : theme.colors.textSecondary }
           ]}>
             {t('tabs.playlists')}
           </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'Bible' ? <BibleBooksScreen /> : <PlaylistsScreen />}
      </View>

      {/* Profile/Auth Modal */}
      <SlideUpModal
        visible={showProfileModal}
        onClose={handleModalClose}
      >
        {user ? (
          <ProfileScreen onClose={handleModalClose} />
        ) : (
          <AuthScreen />
        )}
      </SlideUpModal>
    </View>
  );
};

const App: React.FC = () => {
  return (
    <LocalizationProvider>
      <ThemeProvider>
        <SyncProvider>
          <AuthProvider>
            <MainContent />
            <StatusBar style="auto" />
          </AuthProvider>
        </SyncProvider>
      </ThemeProvider>
    </LocalizationProvider>
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
    paddingBottom: 16,
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
