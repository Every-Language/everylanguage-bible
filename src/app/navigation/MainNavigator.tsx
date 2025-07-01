import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BibleBooksScreen } from '@/features/bible/screens/BibleBooksScreen';
import { MiniPlayer } from '@/features/audio/components/MiniPlayer';
import { type Book } from '@/shared/utils';
import { Colors, Fonts, Dimensions } from '@/shared/constants';
import { useAudioStore } from '@/shared/store';

// Placeholder screens for now
const ResourcesScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Resources</Text>
    <Text style={styles.placeholderSubtext}>Coming soon!</Text>
  </View>
);

const Tab = createBottomTabNavigator();

export const MainNavigator: React.FC = () => {
  const {
    currentBook,
    currentChapter,
    isPlaying,
    setCurrentAudio,
    togglePlayPause,
    playNext,
    playPrevious,
  } = useAudioStore();

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
          tabBarActiveTintColor: Colors.interactive.active,
          tabBarInactiveTintColor: Colors.interactive.inactive,
          tabBarStyle: {
            backgroundColor: Colors.background.primary,
            borderTopColor: Colors.border.light,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  placeholderText: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.text.primary,
    marginBottom: Dimensions.spacing.sm,
  },
  placeholderSubtext: {
    fontSize: Fonts.size.base,
    color: Colors.text.secondary,
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
