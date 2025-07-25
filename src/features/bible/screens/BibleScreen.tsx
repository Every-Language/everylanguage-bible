import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';

import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { ToggleButtons, SlideUpPanel, useHeader } from '@/shared';

// ChapterCard moved to MainNavigator level
import { loadBibleBooks, type Book } from '@/shared/utils';
import { Fonts, Dimensions } from '@/shared/constants';
import {
  useTheme,
  useChapterCardStore,
  useHelpPanelStore,
} from '@/shared/store';
import { useHorizontalSlideAnimation } from '@/shared/hooks';
import { BibleContentSwitcher } from '../components/bible-screen';

interface BibleScreenProps {
  _onChapterSelect?: (book: Book, chapter: number) => void; // Moved to MainNavigator
  _onVerseSelect?: (book: Book, chapter: number, verse: number) => void; // Moved to MainNavigator
  _onThemeDemoPress?: () => void; // Prefixed with _ since it's not used in this context
}

type TestamentMode = 'old' | 'new';

export const BibleScreen: React.FC<BibleScreenProps> = () => {
  const { colors } = useTheme();
  const { openChapterCard } = useChapterCardStore();
  const { isOpen: isHelpPanelOpen, closeHelpPanel } = useHelpPanelStore();
  const { setCurrentScreen, setBottomContent } = useHeader();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [testamentMode, setTestamentMode] = useState<TestamentMode>('old');

  // Use the horizontal slide animation hook
  const { slideAnimation, gestureHandler, updateAnimation } =
    useHorizontalSlideAnimation({
      onModeChange: (newMode: string) =>
        setTestamentMode(newMode as TestamentMode),
      modes: ['old', 'new'],
      currentMode: testamentMode,
    });

  // Update animation when testament mode changes externally
  useEffect(() => {
    updateAnimation(testamentMode);
  }, [testamentMode, updateAnimation]);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 500));
        const bibleBooks = loadBibleBooks();
        setBooks(bibleBooks);
      } catch (error) {
        // Error loading books - could implement error reporting here
        void error;
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  // Stable toggle handler
  const handleToggleSelect = useCallback((key: string) => {
    setTestamentMode(key as TestamentMode);
  }, []);

  // Memoized toggle buttons to prevent unnecessary recreations
  const toggleButtons = useMemo(() => {
    const toggleOptions = [
      { key: 'old', label: 'Old Testament' },
      { key: 'new', label: 'New Testament' },
    ];

    return (
      <ToggleButtons
        options={toggleOptions}
        selectedKey={testamentMode}
        onSelect={handleToggleSelect}
        testID='testament-toggle'
        height={28}
        fontSize={Fonts.size.sm}
      />
    );
  }, [testamentMode, handleToggleSelect]);

  // Set up header content
  useEffect(() => {
    setCurrentScreen('bible-books');
  }, [setCurrentScreen]);

  // Update header content when toggle buttons change
  useEffect(() => {
    setBottomContent(toggleButtons);
  }, [setBottomContent, toggleButtons]);

  const handleBookPress = (book: Book) => {
    // Open chapter card overlay for the selected book
    openChapterCard(book);
  };

  const handleGoToNewTestament = () => {
    setTestamentMode('new');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bibleBooksBackground || colors.background,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bibleBooksBackground || colors.background,
    },
    loadingText: {
      marginTop: Dimensions.spacing.md,
      fontSize: Fonts.size.base,
      color: colors.secondary,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={colors.primary} />
        <Text style={styles.loadingText}>Loading Bible books...</Text>
      </View>
    );
  }

  // Separate books by testament
  const oldTestamentBooks = books.filter(book => book.testament === 'old');
  const newTestamentBooks = books.filter(book => book.testament === 'new');

  return (
    <View style={styles.container}>
      {/* Header content will be managed by context */}

      {/* Content Area with Swipe Support */}
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        simultaneousHandlers={[]}
        shouldCancelWhenOutside={false}
        enableTrackpadTwoFingerGesture={false}
        activeOffsetX={[-20, 20]}
        failOffsetY={[-20, 20]}>
        <Animated.View style={{ flex: 1 }}>
          <BibleContentSwitcher
            oldTestamentBooks={oldTestamentBooks}
            newTestamentBooks={newTestamentBooks}
            onBookPress={handleBookPress}
            onGoToNewTestament={handleGoToNewTestament}
            slideAnimation={slideAnimation}
          />
        </Animated.View>
      </PanGestureHandler>

      {/* Chapter Card moved to MainNavigator level */}

      {/* Help Panel - Test SlideUpPanel */}
      <SlideUpPanel
        isVisible={isHelpPanelOpen}
        onClose={closeHelpPanel}
        title='Help & Support'
        testID='help-panel'>
        <View style={{ paddingVertical: Dimensions.spacing.md }}>
          <Text
            style={{
              fontSize: Fonts.size.lg,
              color: colors.text,
              fontWeight: Fonts.weight.semibold,
              marginBottom: Dimensions.spacing.md,
            }}>
            Welcome to the Bible App!
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.text,
              lineHeight: 24,
              marginBottom: Dimensions.spacing.md,
            }}>
            This is a test panel to demonstrate the SlideUpPanel component. You
            can:
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.text,
              lineHeight: 24,
              marginBottom: Dimensions.spacing.xs,
            }}>
            • Drag the bar at the top to close
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.text,
              lineHeight: 24,
              marginBottom: Dimensions.spacing.xs,
            }}>
            • Tap the X button to close
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.text,
              lineHeight: 24,
              marginBottom: Dimensions.spacing.xs,
            }}>
            • Tap the backdrop to close
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.text,
              lineHeight: 24,
              marginTop: Dimensions.spacing.md,
            }}>
            This panel demonstrates the full-screen mode with drag-to-close
            functionality.
          </Text>
        </View>
      </SlideUpPanel>
    </View>
  );
};
