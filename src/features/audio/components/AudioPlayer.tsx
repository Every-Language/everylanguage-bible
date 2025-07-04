/**
 * AudioPlayer Component
 *
 * Complete audio player component with verse-level navigation,
 * playback controls, and integration with our audio services.
 *
 * @since 1.0.0
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import type { PlaybackSpeed } from '../types';

/**
 * Props interface for AudioPlayer component
 */
export interface AudioPlayerProps {
  /** Book ID to load (e.g., 'gen') */
  bookId: string;
  /** Chapter number to load */
  chapterNumber: number;
  /** Auto-play when chapter loads */
  autoPlay?: boolean;
  /** Custom styling */
  style?: any;
  /** Called when user selects a verse */
  onVerseSelect?: (verseNumber: number) => void;
  /** Called when chapter changes */
  onChapterChange?: (bookId: string, chapterNumber: number) => void;
}

/**
 * AudioPlayer Component with real functionality
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  bookId,
  chapterNumber,
  autoPlay = false,
  style,
  onVerseSelect,
  onChapterChange: _onChapterChange,
}) => {
  // Use our real audio player hook
  const {
    // State
    currentTrack,
    currentChapter,
    isLoaded,
    isPlaying,
    isLoading,
    positionMillis,
    durationMillis,
    currentVerse,
    volume,
    playbackSpeed,
    error,

    // Actions
    loadChapter,
    play,
    pause,
    stop,
    // seekTo,
    skipForward,
    skipBackward,
    nextVerse,
    previousVerse,
    goToVerse,
    setVolume,
    setPlaybackSpeed,
    clearError,
    // unload,
  } = useAudioPlayer();

  // Load chapter when props change
  useEffect(() => {
    const loadChapterData = async () => {
      try {
        await loadChapter(bookId, chapterNumber);
      } catch (err) {
        console.error('Failed to load chapter:', err);
      }
    };

    loadChapterData();
  }, [bookId, chapterNumber, loadChapter]);

  // Auto-play when loaded
  useEffect(() => {
    if (autoPlay && isLoaded && !isPlaying) {
      play().catch(console.error);
    }
  }, [autoPlay, isLoaded, isPlaying, play]);

  // Notify parent of verse changes
  useEffect(() => {
    if (currentVerse && onVerseSelect) {
      onVerseSelect(currentVerse);
    }
  }, [currentVerse, onVerseSelect]);

  // Handle verse navigation
  const handleNextVerse = async () => {
    try {
      await nextVerse();
    } catch (err) {
      console.error('Failed to go to next verse:', err);
    }
  };

  const handlePreviousVerse = async () => {
    try {
      await previousVerse();
    } catch (err) {
      console.error('Failed to go to previous verse:', err);
    }
  };

  const handleGoToVerse = async (verseNumber: number) => {
    try {
      await goToVerse(verseNumber);
    } catch (err) {
      console.error('Failed to go to verse:', err);
    }
  };

  // Handle playback controls
  const handlePlay = async () => {
    try {
      await play();
    } catch (err) {
      console.error('Failed to play:', err);
    }
  };

  const handlePause = async () => {
    try {
      await pause();
    } catch (err) {
      console.error('Failed to pause:', err);
    }
  };

  const handleStop = async () => {
    try {
      await stop();
    } catch (err) {
      console.error('Failed to stop:', err);
    }
  };

  // Handle speed change
  const handleSpeedChange = async (speed: PlaybackSpeed) => {
    try {
      await setPlaybackSpeed(speed);
    } catch (err) {
      console.error('Failed to change speed:', err);
    }
  };

  // Handle volume change
  const handleVolumeChange = async (newVolume: number) => {
    try {
      await setVolume(newVolume);
    } catch (err) {
      console.error('Failed to change volume:', err);
    }
  };

  // Handle error display
  const handleErrorDismiss = () => {
    clearError();
  };

  // Format time helper
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Available playback speeds
  const playbackSpeeds: PlaybackSpeed[] = [
    0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0,
  ];

  // Available volume levels
  const volumeLevels = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <View style={[styles.container, style]}>
      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={handleErrorDismiss}
            style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header with chapter info */}
      <View style={styles.header}>
        <Text style={styles.chapterTitle}>
          {currentChapter
            ? `${bookId.toUpperCase()} ${chapterNumber}`
            : 'Loading...'}
        </Text>
        <Text style={styles.chapterSubtitle}>
          {currentChapter
            ? `${currentChapter.total_verses} verses`
            : 'Audio Bible Player'}
        </Text>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chapter...</Text>
        </View>
      )}

      {/* Main playback controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            !isLoaded && styles.controlButtonDisabled,
          ]}
          onPress={handlePreviousVerse}
          disabled={!isLoaded}>
          <Text style={styles.controlText}>⏮️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.playButton,
            !isLoaded && styles.controlButtonDisabled,
          ]}
          onPress={isPlaying ? handlePause : handlePlay}
          disabled={!isLoaded}>
          <Text style={styles.controlText}>{isPlaying ? '⏸️' : '▶️'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            !isLoaded && styles.controlButtonDisabled,
          ]}
          onPress={handleNextVerse}
          disabled={!isLoaded}>
          <Text style={styles.controlText}>⏭️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            !isLoaded && styles.controlButtonDisabled,
          ]}
          onPress={handleStop}
          disabled={!isLoaded}>
          <Text style={styles.controlText}>⏹️</Text>
        </TouchableOpacity>
      </View>

      {/* Skip controls */}
      <View style={styles.skipControls}>
        <TouchableOpacity
          style={[styles.skipButton, !isLoaded && styles.controlButtonDisabled]}
          onPress={() => skipBackward(10)}
          disabled={!isLoaded}>
          <Text style={styles.skipText}>⏪ 10s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.skipButton, !isLoaded && styles.controlButtonDisabled]}
          onPress={() => skipForward(10)}
          disabled={!isLoaded}>
          <Text style={styles.skipText}>10s ⏩</Text>
        </TouchableOpacity>
      </View>

      {/* Progress display */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>
          {formatTime(positionMillis)} / {formatTime(durationMillis)}
        </Text>
        {/* Simple progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Current verse indicator */}
      {currentVerse && (
        <View style={styles.currentVerse}>
          <Text style={styles.currentVerseText}>Verse {currentVerse}</Text>
          <TouchableOpacity
            style={styles.verseButton}
            onPress={() => {
              Alert.prompt('Go to Verse', 'Enter verse number:', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Go',
                  onPress: text => {
                    const verseNumber = parseInt(text || '0', 10);
                    if (
                      verseNumber > 0 &&
                      currentChapter &&
                      verseNumber <= currentChapter.total_verses
                    ) {
                      handleGoToVerse(verseNumber);
                    }
                  },
                },
              ]);
            }}>
            <Text style={styles.verseButtonText}>Go to verse</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Playback speed controls */}
      <View style={styles.speedContainer}>
        <Text style={styles.speedLabel}>Speed:</Text>
        {playbackSpeeds.map(speed => (
          <TouchableOpacity
            key={speed}
            style={[
              styles.speedButton,
              playbackSpeed === speed && styles.speedButtonActive,
              !isLoaded && styles.controlButtonDisabled,
            ]}
            onPress={() => handleSpeedChange(speed)}
            disabled={!isLoaded}>
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

      {/* Volume controls */}
      <View style={styles.volumeContainer}>
        <Text style={styles.volumeLabel}>Volume:</Text>
        {volumeLevels.map(vol => (
          <TouchableOpacity
            key={vol}
            style={[
              styles.volumeButton,
              volume === vol && styles.volumeButtonActive,
              !isLoaded && styles.controlButtonDisabled,
            ]}
            onPress={() => handleVolumeChange(vol)}
            disabled={!isLoaded}>
            <Text
              style={[
                styles.volumeText,
                volume === vol && styles.volumeTextActive,
              ]}>
              {vol === 0
                ? '🔇'
                : vol === 1
                  ? '🔊'
                  : `${Math.round(vol * 100)}%`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status information */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status:{' '}
          {isLoading
            ? 'Loading'
            : isLoaded
              ? isPlaying
                ? 'Playing'
                : 'Ready'
              : 'Not loaded'}
        </Text>
        <Text style={styles.statusText}>
          Track: {currentTrack?.id || 'None'}
        </Text>
        <Text style={styles.statusText}>
          Quality: {currentTrack?.quality || 'N/A'}
        </Text>
      </View>
    </View>
  );
};

/**
 * Styles for AudioPlayer component
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    flex: 1,
  },
  errorButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chapterTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  chapterSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  controlButtonDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.5,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    width: 60,
    height: 60,
  },
  controlText: {
    fontSize: 20,
  },
  skipControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  skipButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  skipText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  currentVerse: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentVerseText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '500',
  },
  verseButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  verseButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  volumeLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  volumeButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  volumeButtonActive: {
    backgroundColor: '#ff9800',
  },
  volumeText: {
    fontSize: 12,
    color: '#333',
  },
  volumeTextActive: {
    color: '#fff',
  },
  statusContainer: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});
