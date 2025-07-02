/**
 * AudioPlayer Component (PLACEHOLDER)
 *
 * This is a functional placeholder component that demonstrates the audio
 * player interface. The UI developer can replace this with a beautiful
 * design while keeping the same props interface.
 *
 * 🎨 UI DEVELOPER: Replace this entire component with your beautiful design!
 * Keep the AudioPlayerProps interface exactly the same.
 *
 * @since 1.0.0
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { BibleChapter, PlaybackSpeed } from '../types';

/**
 * Props interface for AudioPlayer component
 *
 * NOTE TO UI DEVELOPER: Keep this interface exactly as-is.
 * Only replace the UI implementation inside the component.
 */
export interface AudioPlayerProps {
  /** Current chapter being played */
  chapter: BibleChapter;
  /** Auto-play when chapter loads */
  autoPlay?: boolean;
  /** Custom styling */
  style?: any;
  /** Called when user changes chapter */
  onChapterChange?: (chapterId: string) => void;
  /** Called when user selects a verse */
  onVerseSelect?: (verseNumber: number) => void;
}

/**
 * PLACEHOLDER AudioPlayer Component
 *
 * 🎨 UI DEVELOPER: Replace the content inside this component
 * with your beautiful design. Keep the same props interface.
 *
 * The real implementation will use:
 * - useAudioPlayer hook (we'll create this next)
 * - audioService for actual playback
 * - Zustand store for state management
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  chapter,
  autoPlay = false,
  style,
  onChapterChange: _onChapterChange,
  onVerseSelect,
}) => {
  // PLACEHOLDER STATE (UI Developer: Replace with useAudioPlayer hook)
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number>(1);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration] = useState(300); // 5 minutes placeholder

  // PLACEHOLDER FUNCTIONS (UI Developer: These will come from useAudioPlayer)
  const play = () => {
    setIsPlaying(true);
    console.log('🎵 Playing chapter:', chapter.id);
  };

  const pause = () => {
    setIsPlaying(false);
    console.log('⏸️ Paused');
  };

  const stop = () => {
    setIsPlaying(false);
    setCurrentPosition(0);
    console.log('⏹️ Stopped');
  };

  const nextVerse = () => {
    const newVerse = currentVerse + 1;
    setCurrentVerse(newVerse);
    onVerseSelect?.(newVerse);
    console.log('⏭️ Next verse:', newVerse);
  };

  const previousVerse = () => {
    const newVerse = Math.max(1, currentVerse - 1);
    setCurrentVerse(newVerse);
    onVerseSelect?.(newVerse);
    console.log('⏮️ Previous verse:', newVerse);
  };

  const playbackSpeeds: PlaybackSpeed[] = [
    0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0,
  ];

  return (
    <View style={[styles.container, style]}>
      {/* 🎨 REPLACE: Header with chapter info */}
      <View style={styles.header}>
        <Text style={styles.chapterTitle}>Chapter {chapter.id}</Text>
        <Text style={styles.chapterSubtitle}>
          Audio Bible Player (Placeholder)
        </Text>
      </View>

      {/* 🎨 REPLACE: Main playback controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={previousVerse}>
          <Text style={styles.controlText}>⏮️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.playButton]}
          onPress={isPlaying ? pause : play}>
          <Text style={styles.controlText}>{isPlaying ? '⏸️' : '▶️'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={nextVerse}>
          <Text style={styles.controlText}>⏭️</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={stop}>
          <Text style={styles.controlText}>⏹️</Text>
        </TouchableOpacity>
      </View>

      {/* 🎨 REPLACE: Progress display */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>
          {formatTime(currentPosition)} / {formatTime(duration)}
        </Text>
      </View>

      {/* 🎨 REPLACE: Playback speed controls */}
      <View style={styles.speedContainer}>
        <Text style={styles.speedLabel}>Speed:</Text>
        {playbackSpeeds.map(speed => (
          <TouchableOpacity
            key={speed}
            style={[
              styles.speedButton,
              playbackSpeed === speed && styles.speedButtonActive,
            ]}
            onPress={() => {
              setPlaybackSpeed(speed);
              console.log('🎛️ Speed changed to:', speed);
            }}>
            <Text
              style={[
                styles.speedText,
                playbackSpeed === speed && styles.speedTextActive,
              ]}>
              {speed}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🎨 REPLACE: Current verse indicator */}
      <View style={styles.currentVerse}>
        <Text style={styles.currentVerseText}>Verse {currentVerse}</Text>
      </View>

      {/* 🎨 REPLACE: Status information */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {isPlaying ? 'Playing' : 'Paused'}
        </Text>
        <Text style={styles.statusText}>
          Auto-play: {autoPlay ? 'Enabled' : 'Disabled'}
        </Text>
      </View>

      {/* Developer Notes */}
      <View style={styles.devNotes}>
        <Text style={styles.devNotesTitle}>🎨 UI Developer Notes:</Text>
        <Text style={styles.devNotesText}>
          • Replace this placeholder with your beautiful design{'\n'}• Keep the
          AudioPlayerProps interface unchanged{'\n'}• Use useAudioPlayer hook
          for real functionality{'\n'}• All console.log statements show expected
          behavior
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
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * PLACEHOLDER STYLES
 *
 * 🎨 UI DEVELOPER: Replace these with your design system styles
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  chapterSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    width: 60,
    height: 60,
  },
  controlText: {
    fontSize: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  speedLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  speedButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  speedButtonActive: {
    backgroundColor: '#4CAF50',
  },
  speedText: {
    fontSize: 12,
    color: '#333',
  },
  speedTextActive: {
    color: '#fff',
  },
  currentVerse: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentVerseText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  devNotes: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  devNotesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  devNotesText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
});
