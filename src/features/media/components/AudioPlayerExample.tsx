import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useAudioService } from '../hooks/useAudioService';
import { useTheme } from '@/shared/context/ThemeContext';
import { MediaTrack } from '@/shared/context/MediaPlayerContext';

interface AudioPlayerExampleProps {
  audioFiles?: Array<{
    id: string;
    title: string;
    subtitle: string;
    filePath: string;
    duration: number;
  }>;
}

export const AudioPlayerExample: React.FC<AudioPlayerExampleProps> = ({
  audioFiles = [],
}) => {
  const { theme } = useTheme();
  const [selectedTrack, setSelectedTrack] = useState<MediaTrack | null>(null);

  const { state, actions, audioServiceState, isAudioServiceReady } =
    useAudioService({
      autoPlay: false,
      onError: error => {
        Alert.alert('Audio Error', error);
      },
      onLoad: duration => {
        console.log('Audio loaded with duration:', duration);
      },
    });

  const handlePlayTrack = async (audioFile: (typeof audioFiles)[0]) => {
    const track: MediaTrack = {
      id: audioFile.id,
      title: audioFile.title,
      subtitle: audioFile.subtitle,
      duration: audioFile.duration,
      currentTime: 0,
      url: audioFile.filePath,
    };

    setSelectedTrack(track);
    await actions.setCurrentTrack(track);
  };

  const handlePlayPause = async () => {
    if (state.isPlaying) {
      await actions.pause();
    } else {
      await actions.play();
    }
  };

  const handleSeek = async (time: number) => {
    await actions.seekTo(time);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
    },
    trackItem: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      marginBottom: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    trackTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    trackSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    trackPath: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: 'monospace',
    },
    playButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    playButtonText: {
      color: theme.colors.textInverse,
      fontWeight: '600',
    },
    controlsContainer: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 8,
      marginTop: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    controlsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    controlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    controlButton: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      marginRight: 8,
    },
    controlButtonText: {
      color: theme.colors.textInverse,
      fontSize: 12,
    },
    statusText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    noFilesText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 40,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Audio Player Example</Text>

      {audioFiles.length === 0 ? (
        <Text style={styles.noFilesText}>
          No audio files available. Add some audio files to test the player.
        </Text>
      ) : (
        <>
          {/* Audio File List */}
          {audioFiles.map(audioFile => (
            <View key={audioFile.id} style={styles.trackItem}>
              <Text style={styles.trackTitle}>{audioFile.title}</Text>
              <Text style={styles.trackSubtitle}>{audioFile.subtitle}</Text>
              <Text style={styles.trackPath}>{audioFile.filePath}</Text>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => handlePlayTrack(audioFile)}>
                <Text style={styles.playButtonText}>Load & Play</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Audio Controls */}
          {selectedTrack && (
            <View style={styles.controlsContainer}>
              <Text style={styles.controlsTitle}>Now Playing</Text>
              <Text style={styles.trackTitle}>{selectedTrack.title}</Text>
              <Text style={styles.trackSubtitle}>{selectedTrack.subtitle}</Text>

              <View style={styles.controlRow}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handlePlayPause}>
                  <Text style={styles.controlButtonText}>
                    {state.isPlaying ? 'Pause' : 'Play'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => actions.stop()}>
                  <Text style={styles.controlButtonText}>Stop</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() =>
                    handleSeek(
                      Math.max(0, state.currentTrack?.currentTime || 0) - 10
                    )
                  }>
                  <Text style={styles.controlButtonText}>-10s</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() =>
                    handleSeek((state.currentTrack?.currentTime || 0) + 10)
                  }>
                  <Text style={styles.controlButtonText}>+10s</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.statusText}>
                Status: {isAudioServiceReady ? 'Ready' : 'Loading...'}
              </Text>
              <Text style={styles.statusText}>
                Audio Service:{' '}
                {audioServiceState.isLoaded ? 'Loaded' : 'Not Loaded'}
              </Text>
              <Text style={styles.progressText}>
                Progress: {formatTime(state.currentTrack?.currentTime || 0)} /{' '}
                {formatTime(state.currentTrack?.duration || 0)}
              </Text>
              <Text style={styles.progressText}>
                Volume: {Math.round(state.volume * 100)}% | Speed:{' '}
                {state.playbackRate}x
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};
