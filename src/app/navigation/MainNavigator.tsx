import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BibleBooksScreen } from '@/features/bible/screens/BibleBooksScreen';
import { MiniPlayer } from '@/features/audio/components/MiniPlayer';
import { type Book } from '@/shared/utils';
import { Fonts, Dimensions } from '@/shared/constants';
import { useAudioStore, useTheme } from '@/shared/store';

const Tab = createBottomTabNavigator();

export const MainNavigator: React.FC = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const {
    currentBook,
    currentChapter,
    isPlaying,
    setCurrentAudio,
    togglePlayPause,
    playNext,
    playPrevious,
  } = useAudioStore();

  // Updated Resources screen with theme toggle
  const ResourcesScreen = () => (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderText}>Resources</Text>
      <Text style={styles.placeholderSubtext}>Coming soon!</Text>

      {/* Theme Toggle Button */}
      <TouchableOpacity
        style={styles.themeButton}
        onPress={toggleTheme}
        accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
        <Text style={styles.themeButtonText}>
          {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.themeInfo}>
        Current theme: {isDark ? 'Dark' : 'Light'}
      </Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    placeholderScreen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: Dimensions.spacing.xl,
    },
    placeholderText: {
      fontSize: Fonts.size['2xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginBottom: Dimensions.spacing.sm,
    },
    placeholderSubtext: {
      fontSize: Fonts.size.base,
      color: colors.secondary,
      marginBottom: Dimensions.spacing.xl,
    },
    themeButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      borderRadius: Dimensions.radius.lg,
      marginBottom: Dimensions.spacing.md,
    },
    themeButtonText: {
      color: colors.background,
      fontSize: Fonts.size.base,
      fontWeight: Fonts.weight.semibold,
      textAlign: 'center',
    },
    themeInfo: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
      fontStyle: 'italic',
    },
    tabIcon: {
      fontSize: Dimensions.component.tabIcon.size,
    },
    miniPlayerContainer: {
      position: 'absolute',
      bottom: Dimensions.layout.tabBarHeight,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
  });

  const handleChapterSelect = (book: Book, chapter: number) => {
    setCurrentAudio(book, chapter);
    // Auto-start playback when chapter is selected
    console.log('Selected chapter:', `${book.name} ${chapter}`);
  };

  const handlePlayPause = () => {
    togglePlayPause();
  };

  const handlePrevious = () => {
    playPrevious();
  };

  const handleNext = () => {
    playNext();
  };

  const handleExpand = () => {
    // In a real app, this would open the full player
    console.log('Expand player');
  };

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.secondary,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.primary + '30',
            paddingBottom: currentBook ? Dimensions.layout.miniPlayerHeight : 0,
          },
        }}>
        <Tab.Screen
          name='Bible'
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={[styles.tabIcon, { color }]}>📖</Text>
            ),
          }}>
          {() => <BibleBooksScreen onChapterSelect={handleChapterSelect} />}
        </Tab.Screen>

        <Tab.Screen
          name='Resources'
          component={ResourcesScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={[styles.tabIcon, { color }]}>📚</Text>
            ),
          }}
        />
      </Tab.Navigator>

      {/* Mini Player Overlay */}
      {currentBook && currentChapter && (
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer
            title={currentBook.name}
            subtitle={`Chapter ${currentChapter}`}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onExpand={handleExpand}
            testID='main-mini-player'
          />
        </View>
      )}
    </View>
  );
};
