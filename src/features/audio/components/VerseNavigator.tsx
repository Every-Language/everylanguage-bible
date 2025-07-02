/**
 * VerseNavigator Component (PLACEHOLDER)
 *
 * Displays a scrollable list of verses with the current verse highlighted.
 * Allows users to tap verses to navigate directly to them.
 *
 * 🎨 UI DEVELOPER: Replace this with your beautiful verse navigation design!
 *
 * @since 1.0.0
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type { BibleVerse } from '../types';

/**
 * Props interface for VerseNavigator component
 */
export interface VerseNavigatorProps {
  /** Array of verses to display */
  verses: BibleVerse[];
  /** Currently playing/selected verse number */
  currentVerse?: number;
  /** Callback when user selects a verse */
  onVerseSelect: (verseNumber: number) => void;
  /** Custom styling */
  style?: any;
}

/**
 * PLACEHOLDER VerseNavigator Component
 *
 * 🎨 UI DEVELOPER: Replace with your beautiful verse list design
 */
export const VerseNavigator: React.FC<VerseNavigatorProps> = ({
  verses,
  currentVerse,
  onVerseSelect,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>📖 Verse Navigator (Placeholder)</Text>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        {verses.length > 0 ? (
          verses.map(verse => (
            <TouchableOpacity
              key={verse.verse_number}
              style={[
                styles.verseItem,
                currentVerse === verse.verse_number && styles.verseItemActive,
              ]}
              onPress={() => {
                onVerseSelect(verse.verse_number);
                console.log('📍 Selected verse:', verse.verse_number);
              }}>
              <View style={styles.verseHeader}>
                <Text
                  style={[
                    styles.verseNumber,
                    currentVerse === verse.verse_number &&
                      styles.verseNumberActive,
                  ]}>
                  {verse.verse_number}
                </Text>
                {currentVerse === verse.verse_number && (
                  <Text style={styles.playingIndicator}>▶️</Text>
                )}
              </View>

              <Text
                style={[
                  styles.verseText,
                  currentVerse === verse.verse_number && styles.verseTextActive,
                ]}>
                {verse.text ||
                  `Verse ${verse.verse_number} content would appear here...`}
              </Text>

              {verse.audio_start_time !== undefined && (
                <Text style={styles.timestamp}>
                  {formatTime(verse.audio_start_time)}
                </Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          // Placeholder when no verses are available
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              📝 Verses will appear here when chapter is loaded
            </Text>
            {/* Demo verses for UI development */}
            {[1, 2, 3].map(num => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.verseItem,
                  currentVerse === num && styles.verseItemActive,
                ]}
                onPress={() => onVerseSelect(num)}>
                <View style={styles.verseHeader}>
                  <Text
                    style={[
                      styles.verseNumber,
                      currentVerse === num && styles.verseNumberActive,
                    ]}>
                    {num}
                  </Text>
                  {currentVerse === num && (
                    <Text style={styles.playingIndicator}>▶️</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.verseText,
                    currentVerse === num && styles.verseTextActive,
                  ]}>
                  Demo verse {num} - This is placeholder content for development
                  purposes.
                </Text>
                <Text style={styles.timestamp}>0:0{num - 1}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Developer Notes */}
      <View style={styles.devNotes}>
        <Text style={styles.devNotesText}>
          🎨 Replace with beautiful verse list • Keep VerseNavigatorProps
          interface
        </Text>
      </View>
    </View>
  );
};

/**
 * Helper function to format time in MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * PLACEHOLDER STYLES
 *
 * 🎨 UI DEVELOPER: Replace these with your design system styles
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 12,
    backgroundColor: '#e8f5e8',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  scrollView: {
    maxHeight: 300,
  },
  verseItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#e0e0e0',
  },
  verseItemActive: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196f3',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  verseNumberActive: {
    backgroundColor: '#2196f3',
    color: '#fff',
  },
  playingIndicator: {
    fontSize: 12,
  },
  verseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  verseTextActive: {
    color: '#1976d2',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
  },
  placeholder: {
    padding: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  devNotes: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  devNotesText: {
    fontSize: 10,
    color: '#856404',
    textAlign: 'center',
  },
});
