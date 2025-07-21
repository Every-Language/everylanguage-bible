import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useDownload } from '../hooks/useDownload';
import type { DownloadDetails } from '../services/download';

export const DownloadExample: React.FC = () => {
  const {
    isDownloading,
    progress,
    currentDownload,
    error,
    downloadFile,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    listDownloadedFiles,
    deleteFile,
    clearAllDownloads,
    getTotalDownloadSize,
    resetError,
  } = useDownload();

  const [downloadedFiles, setDownloadedFiles] = useState<DownloadDetails[]>([]);
  const [totalSize, setTotalSize] = useState<number>(0);

  const handleDownload = async () => {
    // Example URLs for different file types
    const testUrls = [
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      'https://jsonplaceholder.typicode.com/posts/1',
    ];

    const url = testUrls[Math.floor(Math.random() * testUrls.length)];

    const result = await downloadFile(url);

    if (result.success && result.details) {
      Alert.alert('Success', `File downloaded: ${result.details.fileName}`);
      refreshFileList();
    } else {
      Alert.alert('Error', result.error || 'Download failed');
    }
  };

  const handlePause = async () => {
    if (currentDownload) {
      const success = await pauseDownload(currentDownload);
      if (success) {
        Alert.alert('Success', 'Download paused');
      } else {
        Alert.alert('Error', 'Failed to pause download');
      }
    }
  };

  const handleResume = async () => {
    if (currentDownload) {
      const result = await resumeDownload(currentDownload);
      if (result.success) {
        Alert.alert('Success', 'Download resumed');
        refreshFileList();
      } else {
        Alert.alert('Error', result.error || 'Failed to resume download');
      }
    }
  };

  const handleCancel = async () => {
    if (currentDownload) {
      const success = await cancelDownload(currentDownload);
      if (success) {
        Alert.alert('Success', 'Download cancelled');
      } else {
        Alert.alert('Error', 'Failed to cancel download');
      }
    }
  };

  const refreshFileList = async () => {
    const files = await listDownloadedFiles();
    setDownloadedFiles(files);

    const size = await getTotalDownloadSize();
    setTotalSize(size);
  };

  const handleDeleteFile = async (file: DownloadDetails) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete ${file.fileName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteFile(file.localUri);
            if (success) {
              Alert.alert('Success', 'File deleted');
              refreshFileList();
            } else {
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Downloads',
      'Are you sure you want to delete all downloaded files?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllDownloads();
            if (success) {
              Alert.alert('Success', 'All downloads cleared');
              setDownloadedFiles([]);
              setTotalSize(0);
            } else {
              Alert.alert('Error', 'Failed to clear downloads');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  React.useEffect(() => {
    refreshFileList();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Download Service Example</Text>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={resetError} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Download Progress */}
      {isDownloading && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Downloading: {currentDownload}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
        </View>
      )}

      {/* Download Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          onPress={handleDownload}
          disabled={isDownloading}
          style={[styles.button, styles.primaryButton]}>
          <Text style={styles.buttonText}>Download Test File</Text>
        </TouchableOpacity>

        {isDownloading && (
          <>
            <TouchableOpacity
              onPress={handlePause}
              style={[styles.button, styles.secondaryButton]}>
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResume}
              style={[styles.button, styles.secondaryButton]}>
              <Text style={styles.buttonText}>Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.button, styles.dangerButton]}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* File Management */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Downloaded Files</Text>
          <Text style={styles.sectionSubtitle}>
            Total Size: {formatFileSize(totalSize)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={refreshFileList}
          style={[styles.button, styles.secondaryButton]}>
          <Text style={styles.buttonText}>Refresh List</Text>
        </TouchableOpacity>

        {downloadedFiles.length > 0 && (
          <TouchableOpacity
            onPress={handleClearAll}
            style={[styles.button, styles.dangerButton]}>
            <Text style={styles.buttonText}>Clear All Downloads</Text>
          </TouchableOpacity>
        )}

        {downloadedFiles.map((file, index) => (
          <View key={index} style={styles.fileItem}>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>{file.fileName}</Text>
              <Text style={styles.fileSize}>
                {formatFileSize(file.fileSize)}
              </Text>
              <Text style={styles.fileDate}>
                {file.downloadDate.toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteFile(file)}
              style={[styles.button, styles.smallButton, styles.dangerButton]}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}

        {downloadedFiles.length === 0 && (
          <Text style={styles.emptyText}>No downloaded files</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    flex: 1,
  },
  errorButton: {
    backgroundColor: '#c62828',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 12,
  },
  progressContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  controlsContainer: {
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196f3',
  },
  secondaryButton: {
    backgroundColor: '#757575',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  fileDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
