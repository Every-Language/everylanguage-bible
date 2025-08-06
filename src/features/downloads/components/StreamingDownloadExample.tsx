import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';
import { useStreamingDownload } from '../hooks/useStreamingDownload';
import { MediaTrack } from '@/features/media/types';

export const StreamingDownloadExample: React.FC = () => {
  const { theme } = useTheme();
  const [isStarted, setIsStarted] = useState(false);

  const { state, startStreamingDownload, cancelDownloads } =
    useStreamingDownload({
      enableStreaming: true,
      minBytesForPlayback: 1024 * 1024, // 1MB
      autoPlayWhenReady: true,
      onDownloadProgress: _progress => {
        // Progress logging removed for production
      },
      onPlaybackReady: () => {
        Alert.alert('Success', 'Audio is ready for playback!');
      },
      onDownloadComplete: () => {
        Alert.alert('Complete', 'All downloads completed!');
      },
      onError: error => {
        Alert.alert('Error', `Download failed: ${error}`);
      },
    });

  const handleStartStreaming = async () => {
    try {
      // Example files - replace with actual file paths and sizes
      const files = [
        {
          filePath: 'https://example.com/audio1.mp3',
          fileName: 'chapter_1_1.mp3',
          fileSize: 5 * 1024 * 1024, // 5MB
          track: {
            id: 'chapter_1_1',
            title: 'Genesis Chapter 1 - Part 1',
            subtitle: 'Genesis 1',
            duration: 300, // 5 minutes
            currentTime: 0,
            isPlaying: false,
          } as MediaTrack,
        },
        {
          filePath: 'https://example.com/audio2.mp3',
          fileName: 'chapter_1_2.mp3',
          fileSize: 4 * 1024 * 1024, // 4MB
        },
        {
          filePath: 'https://example.com/audio3.mp3',
          fileName: 'chapter_1_3.mp3',
          fileSize: 3 * 1024 * 1024, // 3MB
        },
      ];

      await startStreamingDownload(files, {
        streamFirstFile: true,
        batchId: 'example_batch',
        metadata: {
          chapterId: '1',
          bookName: 'Genesis',
          chapterTitle: 'Chapter 1',
        },
      });

      setIsStarted(true);
    } catch (error) {
      Alert.alert('Error', `Failed to start streaming: ${error}`);
    }
  };

  const handleCancel = async () => {
    await cancelDownloads();
    setIsStarted(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Streaming Download Example
      </Text>

      <View style={styles.statusContainer}>
        <Text
          style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          Status: {state.isDownloading ? 'Downloading' : 'Idle'}
        </Text>

        {state.isStreaming && (
          <Text style={[styles.statusText, { color: theme.colors.primary }]}>
            Streaming: {state.isPlaybackReady ? 'Ready' : 'Buffering'}
          </Text>
        )}

        {state.isDownloading && (
          <Text
            style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            Progress: {Math.round(state.streamingProgress * 100)}%
          </Text>
        )}

        {state.error && (
          <Text style={[styles.statusText, { color: theme.colors.error }]}>
            Error: {state.error}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {!isStarted ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleStartStreaming}
            disabled={state.isDownloading}>
            <MaterialIcons
              name='cloud-download'
              size={20}
              color={theme.colors.textInverse}
            />
            <Text
              style={[styles.buttonText, { color: theme.colors.textInverse }]}>
              Start Streaming Download
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.error }]}
            onPress={handleCancel}>
            <MaterialIcons
              name='cancel'
              size={20}
              color={theme.colors.textInverse}
            />
            <Text
              style={[styles.buttonText, { color: theme.colors.textInverse }]}>
              Cancel Downloads
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {state.isStreaming && (
        <View style={styles.streamingInfo}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            Streaming Info:
          </Text>
          <Text
            style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • First file streams and plays automatically
          </Text>
          <Text
            style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • Other files download in background
          </Text>
          <Text
            style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • Minimum buffer: 1MB before playback
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    backgroundColor: COLOR_VARIATIONS.BLACK_05,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  streamingInfo: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: COLOR_VARIATIONS.BLACK_05,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
  },
});
