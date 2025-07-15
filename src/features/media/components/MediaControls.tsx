import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';

interface MediaControlsProps {
  showAlbumArt?: boolean;
  compact?: boolean;
}

export const MediaControls: React.FC<MediaControlsProps> = ({
  showAlbumArt = false,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { state, actions } = useMediaPlayer();

  const handlePlayPause = () => {
    if (state.isPlaying) {
      actions.pause();
    } else {
      actions.play();
    }
  };

  const handleSkipBack = () => {
    actions.seekTo(Math.max(0, (state.currentTrack?.currentTime || 0) - 10));
  };

  const handleSkipForward = () => {
    if (state.currentTrack) {
      actions.seekTo(
        Math.min(
          state.currentTrack.duration,
          state.currentTrack.currentTime + 10
        )
      );
    }
  };

  const handleNextTrack = () => {
    actions.nextTrack();
  };

  const handlePreviousTrack = () => {
    actions.previousTrack();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeedDisplay = (): string => {
    return `${state.playbackRate}x`;
  };

  const progressPercentage = state.currentTrack?.duration
    ? (state.currentTrack.currentTime / state.currentTrack.duration) * 100
    : 0;

  if (!state.currentTrack) return null;

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme.colors.border },
          ]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${progressPercentage}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Time Display under seekbar */}
      <View style={styles.timeDisplayContainer}>
        <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
          {formatTime(state.currentTrack.currentTime)}
        </Text>
        <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
          {formatTime(state.currentTrack.duration)}
        </Text>
      </View>

      {/* Main Controls */}
      <View
        style={[
          styles.controlsContainer,
          compact && styles.compactControlsContainer,
        ]}>
        {/* Album Art */}
        {showAlbumArt && (
          <View style={styles.albumArtContainer}>
            <Image
              source={{
                uri: 'https://via.placeholder.com/60x60/8B5CF6/FFFFFF?text=📖',
              }}
              style={styles.albumArt}
            />
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePreviousTrack}>
            <MaterialIcons
              name='skip-previous'
              size={compact ? 24 : 32}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleSkipBack}>
            <MaterialIcons
              name='keyboard-arrow-left'
              size={compact ? 24 : 32}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handlePlayPause}>
            <MaterialIcons
              name={state.isPlaying ? 'pause' : 'play-arrow'}
              size={compact ? 28 : 40}
              color={theme.colors.background}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleSkipForward}>
            <MaterialIcons
              name='keyboard-arrow-right'
              size={compact ? 24 : 32}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleNextTrack}>
            <MaterialIcons
              name='skip-next'
              size={compact ? 24 : 32}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Speed Display */}
        {!compact && (
          <View style={styles.speedInfo}>
            <Text
              style={[styles.speedText, { color: theme.colors.textSecondary }]}>
              {getSpeedDisplay()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  compactContainer: {
    paddingVertical: 4,
  },
  progressBarContainer: {
    height: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  timeDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  controlsContainer: {
    alignItems: 'center',
  },
  compactControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  albumArtContainer: {
    marginBottom: 12,
  },
  albumArt: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    flex: 1,
  },
  controlButton: {
    padding: 8,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  speedInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  speedText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
