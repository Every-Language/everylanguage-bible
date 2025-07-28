import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/context/ThemeContext';
import { useAudioService } from '@/features/media/hooks/useAudioService';
import { formatTime } from '@/features/media/utils/audioUtils';

interface MediaControlsProps {
  showAlbumArt?: boolean;
  compact?: boolean;
}

export const MediaControls: React.FC<MediaControlsProps> = ({
  showAlbumArt = false,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { state, actions } = useAudioService();
  const insets = useSafeAreaInsets();

  const handlePlayPause = async () => {
    if (state.isPlaying) {
      await actions.pause();
    } else {
      await actions.play();
    }
  };

  const handleSkipBack = async () => {
    await actions.seekTo(
      Math.max(0, (state.currentTrack?.currentTime || 0) - 10)
    );
  };

  const handleSkipForward = async () => {
    if (state.currentTrack) {
      await actions.seekTo(
        Math.min(
          state.currentTrack.duration,
          state.currentTrack.currentTime + 10
        )
      );
    }
  };

  const handleNextTrack = async () => {
    await actions.nextTrack();
  };

  const handlePreviousTrack = async () => {
    await actions.previousTrack();
  };

  const getSpeedDisplay = (): string => {
    return `${state.playbackRate}x`;
  };

  const progressPercentage = state.currentTrack?.duration
    ? (state.currentTrack.currentTime / state.currentTrack.duration) * 100
    : 0;

  if (!state.currentTrack) return null;

  const containerStyle = [
    styles.container,
    compact && styles.compactContainer,
    { paddingBottom: compact ? Math.max(insets.bottom, 8) : 8 },
  ];

  return (
    <View style={containerStyle}>
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
