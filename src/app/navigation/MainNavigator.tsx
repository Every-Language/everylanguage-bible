import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BibleBooksScreen } from '@/features/bible/screens/BibleBooksScreen';
import { MiniPlayer } from '@/features/audio/components/MiniPlayer';

// Placeholder screens for now
const BookmarksScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Bookmarks</Text>
    <Text style={styles.placeholderSubtext}>Coming soon!</Text>
  </View>
);

const Tab = createBottomTabNavigator();

interface Book {
  id: string;
  name: string;
  testament: 'old' | 'new';
  chapters: number;
  order: number;
}

export const MainNavigator: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    // In a real app, this would start loading the audio
    console.log('Selected book:', book.name);
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
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e0e0e0',
            paddingBottom: selectedBook ? 70 : 0, // Make space for mini-player
          },
        }}>
        <Tab.Screen
          name='Bible'
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={[styles.tabIcon, { color }]}>📖</Text>
            ),
          }}>
          {() => <BibleBooksScreen onBookSelect={handleBookSelect} />}
        </Tab.Screen>

        <Tab.Screen
          name='Bookmarks'
          component={BookmarksScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={[styles.tabIcon, { color }]}>🔖</Text>
            ),
          }}
        />
      </Tab.Navigator>

      {/* Mini Player Overlay */}
      {selectedBook && (
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer
            title={selectedBook.name}
            subtitle={`Chapter 1`} // This would be dynamic
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
    backgroundColor: '#f8f9fa',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666666',
  },
  tabIcon: {
    fontSize: 20,
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 83, // Height of tab bar
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
