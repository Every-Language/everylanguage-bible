import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/shared/context/ThemeContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MiniPlayer: React.FC = () => {
  const { theme } = useTheme();
  const { state, actions } = useMediaPlayer();

  const handlePlayPause = () => {
    if (state.isPlaying) {
      actions.pause();
    } else {
      actions.play();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = state.currentTrack?.duration 
    ? (state.currentTrack.currentTime / state.currentTrack.duration) * 100 
    : 0;

  if (!state.currentTrack) return null;

  return (
    <View style={styles.container}>
      {/* Blur Background */}
      <BlurView
        intensity={80}
        tint={theme.mode === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: theme.colors.primary,
                width: `${progressPercentage}%`
              }
            ]} 
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Left side - Track info */}
        <View style={styles.trackInfo}>
          <Text 
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {state.currentTrack.title}
          </Text>
          <Text 
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {state.currentTrack.subtitle} • {formatTime(state.currentTrack.currentTime)} / {formatTime(state.currentTrack.duration)}
          </Text>
        </View>

        {/* Right side - Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            onPress={actions.skipBackward}
            style={styles.controlButton}
          >
            <MaterialIcons 
              name="skip-previous" 
              size={28} 
              color={theme.colors.text} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handlePlayPause}
            style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
          >
            <MaterialIcons 
              name={state.isPlaying ? "pause" : "play-arrow"} 
              size={24} 
              color={theme.colors.textInverse} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={actions.skipForward}
            style={styles.controlButton}
          >
            <MaterialIcons 
              name="skip-next" 
              size={28} 
              color={theme.colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    width: SCREEN_WIDTH,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 1,
  },
  progressBar: {
    flex: 1,
    height: 2,
  },
  progressFill: {
    height: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  trackInfo: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 