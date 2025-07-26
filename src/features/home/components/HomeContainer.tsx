import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { BibleContainerScreen } from '@/features/bible';
import { PlaylistsScreen } from '@/features/playlists';
import { BackgroundDownloadsScreen } from '@/features/downloads/screens';
import { HomeTab } from '../types';

interface HomeContainerProps {
  activeTab: HomeTab;
}

export const HomeContainer: React.FC<HomeContainerProps> = ({ activeTab }) => {
  const { theme } = useTheme();

  const renderContent = () => {
    switch (activeTab) {
      case 'Bible':
        return <BibleContainerScreen />;
      case 'Playlists':
        return <PlaylistsScreen />;
      case 'Downloads':
        return <BackgroundDownloadsScreen />;
      default:
        return <BibleContainerScreen />;
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
