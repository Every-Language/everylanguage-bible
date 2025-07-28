import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { useAudioService } from '../hooks/useAudioService';
import { MediaTrack } from '../types';

interface AudioFile {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  filePath: string;
}

interface AudioPlayerExampleProps {
  audioFiles?: AudioFile[];
}

export const AudioPlayerExample: React.FC<AudioPlayerExampleProps> = ({
  audioFiles = [],
}) => {
  const { theme } = useTheme();
  const [selectedTrack, setSelectedTrack] = useState<MediaTrack | null>(null);
  const renderCount = useRef(0);

  // Increment render count for debugging
  renderCount.current += 1;

  const { state, actions, audioServiceState, isAudioServiceReady } =
    useAudioService({
      autoPlay: false,
      onError: error => {
        Alert.alert('Audio Error', error);
      },
      onLoad: _duration => {
        // Audio loaded with duration: _duration
      },
    });

  // Log render count every 10 renders to monitor for infinite loops
  useEffect(() => {
    if (renderCount.current % 10 === 0) {
      // AudioPlayerExample render count: renderCount.current
    }
  }, []); // Added dependency array to prevent infinite loops

  const handlePlayTrack = async (audioFile: (typeof audioFiles)[0]) => {
    const track: MediaTrack = {
      id: audioFile.id,
      title: audioFile.title,
      subtitle: audioFile.subtitle,
      duration: audioFile.duration,
      currentTime: 0,
      isPlaying: false,
      url: audioFile.filePath,
    };

    setSelectedTrack(track);
    // Convert to MediaPlayerTrack format for the context
    const contextTrack = {
      ...track,
      subtitle: track.subtitle || '', // Ensure subtitle is always a string
    };
    await actions.setCurrentTrack(contextTrack);
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Audio Player Example (Renders: {renderCount.current})
      </Text>

      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: theme.colors.text }]}>
          Audio Service Ready: {isAudioServiceReady ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.statusText, { color: theme.colors.text }]}>
          Is Playing: {state.isPlaying ? 'Yes' : 'No'}
        </Text>

        <Text style={[styles.statusText, { color: theme.colors.text }]}>
          Current Track: {state.currentTrack?.title || 'None'}
        </Text>
        <Text style={[styles.statusText, { color: theme.colors.text }]}>
          Progress: {formatTime(state.currentTrack?.currentTime || 0)} /{' '}
          {formatTime(state.currentTrack?.duration || 0)}
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handlePlayPause}
          disabled={!state.currentTrack}>
          <Text
            style={[styles.buttonText, { color: theme.colors.textInverse }]}>
            {state.isPlaying ? 'Pause' : 'Play'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={() => actions.stop()}
          disabled={!state.currentTrack}>
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            Stop
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={() => handleSeek(30)}
          disabled={!state.currentTrack}>
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            Seek to 30s
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tracksContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Available Tracks:
        </Text>
        {audioFiles.map(audioFile => (
          <TouchableOpacity
            key={audioFile.id}
            style={[
              styles.trackItem,
              {
                backgroundColor:
                  selectedTrack?.id === audioFile.id
                    ? theme.colors.primary
                    : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => handlePlayTrack(audioFile)}>
            <Text
              style={[
                styles.trackTitle,
                {
                  color:
                    selectedTrack?.id === audioFile.id
                      ? theme.colors.textInverse
                      : theme.colors.text,
                },
              ]}>
              {audioFile.title}
            </Text>
            <Text
              style={[
                styles.trackSubtitle,
                {
                  color:
                    selectedTrack?.id === audioFile.id
                      ? theme.colors.textInverse
                      : theme.colors.textSecondary,
                },
              ]}>
              {audioFile.subtitle} - {formatTime(audioFile.duration)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.debugContainer}>
        <Text style={[styles.debugTitle, { color: theme.colors.text }]}>
          Debug Info:
        </Text>
        <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
          Audio Service State: {JSON.stringify(audioServiceState, null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tracksContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  trackItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackSubtitle: {
    fontSize: 14,
  },
  debugContainer: {
    marginTop: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
