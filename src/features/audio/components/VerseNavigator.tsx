/**
 * VerseNavigator Component
 *
 * Displays a scrollable list of verses with the current verse highlighted.
 * Allows users to tap verses to navigate directly to them.
 * Shows audio timestamps and current playback position.
 *
 * @since 1.0.0
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/shared/hooks';
import type { VerseTimestamp_temp } from '../types';
import { Colors } from '@/shared/constants/colors';

/**
 * Props interface for VerseNavigator component
 */
export interface VerseNavigatorProps {
  /** Array of verses with audio timestamps */
  verses: VerseTimestamp_temp[];
  /** Currently playing/selected verse number */
  currentVerse?: number;
  /** Current playback position in milliseconds */
  currentPositionMillis?: number;
  /** Whether audio is currently playing */
  isPlaying?: boolean;
  /** Callback when user selects a verse */
  onVerseSelect: (verseNumber: number) => void;
  /** Custom styling */
  style?: ViewStyle;
  /** Whether to auto-scroll to current verse */
  autoScroll?: boolean;
}

/**
 * VerseNavigator Component with real functionality
 */
export const VerseNavigator: React.FC<VerseNavigatorProps> = ({
  verses,
  currentVerse,
  currentPositionMillis = 0,
  isPlaying = false,
  onVerseSelect,
  style,
  autoScroll = true,
}) => {
  const { colors, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to current verse
  useEffect(() => {
    if (autoScroll && currentVerse && scrollViewRef.current) {
      // Find the index of the current verse
      const currentIndex = verses.findIndex(
        v => v.verse_number === currentVerse
      );
      if (currentIndex >= 0) {
        // Scroll to the current verse with some offset
        const itemHeight = 80; // Approximate height of each verse item
        const scrollY = currentIndex * itemHeight;
        scrollViewRef.current.scrollTo({ y: scrollY, animated: true });
      }
    }
  }, [currentVerse, autoScroll, verses]);

  // Helper to format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to check if a verse is currently being played
  const isVersePlaying = (verse: VerseTimestamp_temp): boolean => {
    const currentTimeSeconds = currentPositionMillis / 1000;
    return (
      currentTimeSeconds >= verse.start_time &&
      currentTimeSeconds < verse.end_time
    );
  };

  // Helper to get verse progress (0-1)
  const getVerseProgress = (verse: VerseTimestamp_temp): number => {
    if (!isVersePlaying(verse)) return 0;

    const currentTimeSeconds = currentPositionMillis / 1000;
    const verseProgress =
      (currentTimeSeconds - verse.start_time) / verse.duration;
    return Math.min(Math.max(verseProgress, 0), 1);
  };

  // Dynamic color values
  const surfaceColor = isDark
    ? Colors.background.overlay
    : Colors.background.secondary;
  const borderColor = isDark ? Colors.border.light : Colors.border.medium;
  const borderColorLight = isDark ? Colors.border.light : Colors.border.light;
  const selectedBgColor = isDark ? Colors.primaryLight : Colors.primaryLight;
  const activeBgColor = isDark
    ? Colors.feedback.success
    : Colors.feedback.success;
  const textTertiary = isDark ? Colors.text.tertiary : Colors.text.tertiary;
  const activeTextColor = isDark
    ? Colors.feedback.success
    : Colors.feedback.success;
  const progressBorderColor = isDark
    ? Colors.feedback.success
    : Colors.feedback.success;
  const progressBgColor = isDark
    ? Colors.feedback.success
    : Colors.feedback.success;
  const separatorColor = isDark
    ? Colors.border.light
    : Colors.background.tertiary;
  const successColor = Colors.feedback.success;

  // Dynamic styles using theme colors
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 8,
      elevation: 2,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      maxHeight: 400,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: surfaceColor,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    playingIndicator: {
      backgroundColor: successColor,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    playingText: {
      fontSize: 12,
      color: colors.background,
      fontWeight: '500',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 8,
    },
    verseItem: {
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderLeftWidth: 3,
      borderLeftColor: borderColorLight,
    },
    verseItemSelected: {
      backgroundColor: selectedBgColor,
      borderLeftColor: colors.primary,
    },
    verseItemActive: {
      backgroundColor: activeBgColor,
      borderLeftColor: successColor,
    },
    verseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    verseNumberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    verseNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.secondary,
      minWidth: 30,
    },
    verseNumberSelected: {
      color: colors.primary,
    },
    verseNumberActive: {
      color: successColor,
    },
    activeIndicator: {
      marginLeft: 4,
      fontSize: 12,
    },
    timingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timestamp: {
      fontSize: 12,
      color: colors.secondary,
      fontFamily: 'monospace',
    },
    duration: {
      fontSize: 10,
      color: textTertiary,
      marginLeft: 4,
    },
    verseText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 4,
    },
    verseTextSelected: {
      color: colors.primary,
    },
    verseTextActive: {
      color: activeTextColor,
      fontWeight: '500',
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: progressBorderColor,
    },
    progressBar: {
      flex: 1,
      height: 3,
      backgroundColor: progressBgColor,
      borderRadius: 1.5,
      marginRight: 8,
    },
    progressFill: {
      height: '100%',
      backgroundColor: successColor,
      borderRadius: 1.5,
    },
    progressText: {
      fontSize: 10,
      color: successColor,
      fontWeight: 'bold',
      minWidth: 30,
    },
    separator: {
      height: 1,
      backgroundColor: separatorColor,
      marginTop: 8,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.secondary,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: textTertiary,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 8,
      backgroundColor: surfaceColor,
      borderTopWidth: 1,
      borderTopColor: borderColor,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
    footerText: {
      fontSize: 12,
      color: colors.secondary,
    },
    footerTime: {
      fontSize: 12,
      color: successColor,
      fontFamily: 'monospace',
      fontWeight: 'bold',
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📖 Verses ({verses.length})</Text>
        {isPlaying && (
          <View style={styles.playingIndicator}>
            <Text style={styles.playingText}>🎵 Playing</Text>
          </View>
        )}
      </View>

      {/* Verses List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}>
        {verses.length > 0 ? (
          verses.map((verse, index) => {
            const isCurrentVerse = currentVerse === verse.verse_number;
            const isActivelyPlaying = isVersePlaying(verse);
            const progress = getVerseProgress(verse);

            return (
              <TouchableOpacity
                key={verse.verse_number}
                style={[
                  styles.verseItem,
                  isCurrentVerse && styles.verseItemSelected,
                  isActivelyPlaying && styles.verseItemActive,
                ]}
                onPress={() => {
                  onVerseSelect(verse.verse_number);
                }}
                activeOpacity={0.7}>
                {/* Verse Header */}
                <View style={styles.verseHeader}>
                  <View style={styles.verseNumberContainer}>
                    <Text
                      style={[
                        styles.verseNumber,
                        isCurrentVerse && styles.verseNumberSelected,
                        isActivelyPlaying && styles.verseNumberActive,
                      ]}>
                      {verse.verse_number}
                    </Text>
                    {isActivelyPlaying && isPlaying && (
                      <Text style={styles.activeIndicator}>▶️</Text>
                    )}
                  </View>

                  <View style={styles.timingInfo}>
                    <Text style={styles.timestamp}>
                      {formatTime(verse.start_time)}
                    </Text>
                    <Text style={styles.duration}>
                      ({formatTime(verse.duration)})
                    </Text>
                  </View>
                </View>

                {/* Verse Text */}
                <Text
                  style={[
                    styles.verseText,
                    isCurrentVerse && styles.verseTextSelected,
                    isActivelyPlaying && styles.verseTextActive,
                  ]}
                  numberOfLines={3}>
                  {verse.text || `Verse ${verse.verse_number} content...`}
                </Text>

                {/* Progress Bar for Active Verse */}
                {isActivelyPlaying && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {Math.round(progress * 100)}%
                    </Text>
                  </View>
                )}

                {/* Verse Separator */}
                {index < verses.length - 1 && <View style={styles.separator} />}
              </TouchableOpacity>
            );
          })
        ) : (
          // Empty state
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>📝 No verses available</Text>
            <Text style={styles.emptyStateSubtext}>
              Load a chapter to see verses here
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer with verse count and current info */}
      {verses.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {currentVerse
              ? `Verse ${currentVerse} of ${verses.length}`
              : `${verses.length} verses total`}
          </Text>
          {currentPositionMillis > 0 && (
            <Text style={styles.footerTime}>
              {formatTime(currentPositionMillis / 1000)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
