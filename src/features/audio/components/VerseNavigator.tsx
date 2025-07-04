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
} from 'react-native';
import type { VerseTimestamp_temp } from '../types';

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
  style?: any;
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

/**
 * Styles for VerseNavigator component
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
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
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  playingIndicator: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playingText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  verseItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e0e0e0',
  },
  verseItemSelected: {
    backgroundColor: '#f3e5f5',
    borderLeftColor: '#9c27b0',
  },
  verseItemActive: {
    backgroundColor: '#e8f5e8',
    borderLeftColor: '#4CAF50',
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
    color: '#666',
    minWidth: 30,
  },
  verseNumberSelected: {
    color: '#9c27b0',
  },
  verseNumberActive: {
    color: '#4CAF50',
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
    color: '#666',
    fontFamily: 'monospace',
  },
  duration: {
    fontSize: 10,
    color: '#999',
    marginLeft: 4,
  },
  verseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  verseTextSelected: {
    color: '#7b1fa2',
  },
  verseTextActive: {
    color: '#2e7d32',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e8f5e8',
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: '#c8e6c9',
    borderRadius: 1.5,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
    minWidth: 30,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginTop: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  footerTime: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});
