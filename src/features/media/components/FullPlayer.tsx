import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/shared/context/ThemeContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const FullPlayer: React.FC = () => {
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

  const handleSpeedChange = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(state.playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    actions.setPlaybackRate(speeds[nextIndex]);
  };

  const getSpeedDisplay = () => {
    return `${state.playbackRate}x`;
  };

  const handleRepeat = () => {
    const modes = ['off', 'all', 'one'] as const;
    const currentIndex = modes.indexOf(state.repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    actions.setRepeatMode(modes[nextIndex]);
  };

  const getRepeatIcon = () => {
    switch (state.repeatMode) {
      case 'one': return 'repeat-one';
      case 'all': return 'repeat';
      default: return 'repeat';
    }
  };

  const progressPercentage = state.currentTrack?.duration 
    ? (state.currentTrack.currentTime / state.currentTrack.duration) * 100 
    : 0;

  const renderQueueItem = (track: any, index: number) => {
    const isCurrentTrack = index === state.currentIndex;
    return (
      <TouchableOpacity 
        key={`${track.id}-${index}`}
        style={[
          styles.queueItem,
          isCurrentTrack && { backgroundColor: theme.colors.surfaceVariant }
        ]}
        onPress={() => actions.playTrack(index)}
      >
        <MaterialIcons 
          name="menu" 
          size={20} 
          color={theme.colors.textSecondary} 
          style={styles.dragHandle}
        />
        <View style={styles.queueItemContent}>
          <Text 
            style={[
              styles.queueItemTitle, 
              { color: isCurrentTrack ? theme.colors.primary : theme.colors.text }
            ]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text 
            style={[styles.queueItemSubtitle, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {track.subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!state.currentTrack) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Blur Background */}
      <BlurView
        intensity={80}
        tint={theme.mode === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={actions.collapse} style={styles.headerButton}>
            <MaterialIcons name="keyboard-arrow-down" size={32} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Now Playing</Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="more-vert" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Album Art */}
        <View style={styles.albumArtContainer}>
          <View style={[styles.albumArt, { backgroundColor: theme.colors.surfaceVariant }]}>
            <MaterialIcons name="music-note" size={80} color={theme.colors.textSecondary} />
          </View>
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {state.currentTrack.title}
          </Text>
          <Text style={[styles.trackSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {state.currentTrack.subtitle}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
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
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
              {formatTime(state.currentTrack.currentTime)}
            </Text>
            <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
              {formatTime(state.currentTrack.duration)}
            </Text>
          </View>
        </View>

        {/* Primary Controls */}
        <View style={styles.primaryControls}>
          <TouchableOpacity onPress={actions.skipBackward} style={styles.controlButton}>
            <MaterialIcons name="skip-previous" size={32} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => actions.seek(Math.max(0, state.currentTrack!.currentTime - 10))} style={styles.controlButton}>
            <MaterialIcons name="replay-10" size={32} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handlePlayPause}
            style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
          >
            <MaterialIcons 
              name={state.isPlaying ? "pause" : "play-arrow"} 
              size={36} 
              color={theme.colors.textInverse} 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => actions.seek(Math.min(state.currentTrack!.duration, state.currentTrack!.currentTime + 10))} style={styles.controlButton}>
            <MaterialIcons name="forward-10" size={32} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={actions.skipForward} style={styles.controlButton}>
            <MaterialIcons name="skip-next" size={32} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Secondary Controls */}
        <View style={styles.secondaryControls}>
          <TouchableOpacity onPress={actions.toggleShuffle} style={styles.secondaryButton}>
            <MaterialIcons 
              name="shuffle" 
              size={24} 
              color={state.shuffleMode ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRepeat} style={styles.secondaryButton}>
            <MaterialIcons 
              name={getRepeatIcon()} 
              size={24} 
              color={state.repeatMode !== 'off' ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSpeedChange} style={styles.speedButton}>
            <Text style={[styles.speedText, { color: theme.colors.textSecondary }]}>
              {getSpeedDisplay()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Queue Section */}
        <View style={styles.queueSection}>
          <View style={styles.queueHeader}>
            <Text style={[styles.queueTitle, { color: theme.colors.text }]}>Queue</Text>
            <TouchableOpacity>
              <Text style={[styles.queueAction, { color: theme.colors.primary }]}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.queueContent}>
            <Text style={[styles.queueSubtitle, { color: theme.colors.textSecondary }]}>
              Now Playing
            </Text>
            {renderQueueItem(state.currentTrack, state.currentIndex)}

            {state.queue.length > 1 && (
              <>
                <Text style={[styles.queueSubtitle, { color: theme.colors.textSecondary }]}>
                  Up Next
                </Text>
                {state.queue.slice(state.currentIndex + 1).map((track, index) => 
                  renderQueueItem(track, state.currentIndex + 1 + index)
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  albumArtContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  albumArt: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackSubtitle: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '400',
  },
  primaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
    gap: 40,
  },
  secondaryButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  queueSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  queueTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  queueAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  queueContent: {
    gap: 8,
  },
  queueSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dragHandle: {
    marginRight: 12,
  },
  queueItemContent: {
    flex: 1,
  },
  queueItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  queueItemSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
}); 