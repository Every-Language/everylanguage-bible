import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Book, Chapter } from '../types';

// Type definitions for the Bible stack
export type BibleStackParamList = {
  BibleBooks: undefined;
  BibleChapters: {
    book: Book;
  };
  BibleVerses: {
    book: Book;
    chapter: Chapter;
  };
};

// Re-export the navigation types for use in components
export type BibleStackNavigationProp =
  NativeStackNavigationProp<BibleStackParamList>;

const BibleStack = createNativeStackNavigator<BibleStackParamList>();

// Import screens
import { BibleBooksScreen } from '../screens/BibleBooksScreen';
import { ChapterScreen } from '../screens/ChapterScreen';
import { VersesScreen } from '../screens/VersesScreen';

export const BibleStackNavigator: React.FC = () => {
  return (
    <BibleStack.Navigator
      initialRouteName='BibleBooks'
      screenOptions={{
        headerShown: false, // Hide React Navigation headers - use custom top bar instead
        animation: 'default', // Use platform-specific native animations (iOS: slide, Android: fade/slide up)
        gestureEnabled: true, // Enable swipe-back gesture
        fullScreenGestureEnabled: true, // Enable full-screen swipe gesture on iOS
        animationMatchesGesture: true, // Make animations match gesture interactions for smoother feel
      }}>
      <BibleStack.Screen
        name='BibleBooks'
        component={BibleBooksScreen}
        options={{
          title: 'Bible Books',
          headerLargeTitle: true, // iOS large title style
        }}
      />
      <BibleStack.Screen
        name='BibleChapters'
        component={ChapterScreen}
        options={({ route }) => ({
          title: route.params?.book?.name || 'Chapters',
          headerBackTitle: 'Books', // Custom back button text
        })}
      />
      <BibleStack.Screen
        name='BibleVerses'
        component={VersesScreen}
        options={({ route }) => ({
          title: `${route.params?.book?.name || ''} ${route.params?.chapter?.chapter_number || ''}`,
          headerBackTitle: 'Chapters',
          presentation: 'card', // Smooth card transition
        })}
      />
    </BibleStack.Navigator>
  );
};
