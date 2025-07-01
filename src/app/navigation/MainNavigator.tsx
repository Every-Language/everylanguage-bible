import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BibleBooksScreen } from '@/features/bible/screens/BibleBooksScreen';
import { MiniPlayer } from '@/features/audio/components/MiniPlayer';
import { type Book } from '@/shared/utils';
import { Colors, Fonts, Dimensions } from '@/shared/constants';

// Placeholder screens for now
const ResourcesScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Resources</Text>
    <Text style={styles.placeholderSubtext}>Coming soon!</Text>
  </View>
);

const Tab = createBottomTabNavigator();

interface CurrentAudio {
  book: Book;
  chapter: number;
}

export const MainNavigator: React.FC = () => {
  const [currentAudio, setCurrentAudio] = useState<CurrentAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleChapterSelect = (book: Book, chapter: number) => {
    setCurrentAudio({ book, chapter });
    setIsPlaying(true); // Auto-start playback when chapter is selected
    // In a real app, this would start loading the audio
    console.log('Selected chapter:', `${book.name} ${chapter}`);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real app, this would control audio playback
  };

  const handlePrevious = () => {
    // In a real app, this would go to previous verse
    console.log('Previous verse');
  };

  const handleNext = () => {
    // In a real app, this would go to next verse
    console.log('Next verse');
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
            paddingBottom: currentAudio
              ? Dimensions.layout.miniPlayerHeight
              : 0,
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
      {currentAudio && (
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer
            title={currentAudio.book.name}
            subtitle={`Chapter ${currentAudio.chapter}`}
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
