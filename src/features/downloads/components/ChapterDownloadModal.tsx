import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { supabase } from '@/shared/services/api/supabase';

interface ChapterDownloadModalProps {
  visible: boolean;
  bookName: string;
  chapterTitle: string;
  chapterId: string;
  versionId?: string; // Optional for now, will use constant version 1
  onClose: () => void;
}

export const ChapterDownloadModal: React.FC<ChapterDownloadModalProps> = ({
  visible,
  bookName,
  chapterTitle,
  chapterId,
  versionId,
  onClose,
}) => {
  const { theme } = useTheme();
  const { isConnected, connectionType, isInternetReachable } =
    useNetworkConnectivity();

  // State for online capability check and search
  const [isCheckingOnline, setIsCheckingOnline] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Constant version number for now
  const VERSION_ID = 1;

  // Check online capabilities
  const checkOnlineCapabilities = async () => {
    setIsCheckingOnline(true);
    setSearchError(null);

    try {
      // Test internet connectivity by making a simple request
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
      });

      if (response.ok) {
        setIsOnline(true);
        // Automatically search for media files when online
        await searchMediaFiles();
      } else {
        setIsOnline(false);
        setSearchError('Unable to reach online services');
      }
    } catch {
      setIsOnline(false);
      setSearchError('No internet connection available');
    } finally {
      setIsCheckingOnline(false);
    }
  };

  // Search for media files in Supabase
  const searchMediaFiles = async () => {
    if (!isOnline) return;

    setIsSearching(true);
    setSearchError(null);

    console.log(chapterId);

    try {
      // First search attempt
      const { data: firstSearchData, error: firstError } = await supabase
        .from('media_files')
        .select('*')
        .ilike('start_verse_id', `${chapterId}%`) // Match chapter ID pattern like ps-1-1, ps-1-2, etc.
        .eq('version', Number(versionId) || VERSION_ID)
        .is('deleted_at', null);

      if (firstError) {
        throw firstError;
      }

      // If first search found results, use them
      if (firstSearchData && firstSearchData.length > 0) {
        setSearchResults(firstSearchData);
        console.log(
          `Found ${firstSearchData.length} media files for chapter ${chapterId} on first search`
        );
        return;
      }

      // If no results found, perform second search with same logic
      console.log(
        'No media files found on first search, performing second search...'
      );

      const { data: secondSearchData, error: secondError } = await supabase
        .from('media_files')
        .select('*')
        .ilike('start_verse_id', `${chapterId}%`) // Match chapter ID pattern like ps-1-1, ps-1-2, etc.
        .eq('version', Number(versionId) || VERSION_ID)
        .is('deleted_at', null);

      if (secondError) {
        throw secondError;
      }

      setSearchResults(secondSearchData || []);
      console.log(
        `Found ${secondSearchData?.length || 0} media files for chapter ${chapterId} on second search`
      );
    } catch (error) {
      console.error('Error searching media files:', error);
      setSearchError('Failed to search for media files');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Check online capabilities when modal becomes visible
  useEffect(() => {
    if (visible) {
      checkOnlineCapabilities();
    }
  }, [visible]);

  // Monitor network connectivity changes and recheck when internet resumes
  useEffect(() => {
    if (visible && isConnected && isInternetReachable && !isOnline) {
      // Internet just became available, recheck capabilities and search
      console.log('Internet connection resumed, rechecking capabilities...');
      checkOnlineCapabilities();
    }
  }, [visible, isConnected, isInternetReachable, isOnline]);

  const handleRefresh = () => {
    checkOnlineCapabilities();
  };

  // Calculate total file size and format it
  const getTotalFileSize = () => {
    if (!searchResults || searchResults.length === 0) return 0;

    return searchResults.reduce((total, file) => {
      return total + (file.file_size || 0);
    }, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download requested for', searchResults.length, 'files');
    setIsDownloading(true);

    // Simulate download process (remove this when implementing actual download)
    setTimeout(() => {
      setIsDownloading(false);
      console.log('Download simulation completed');
    }, 2000);
  };

  const getNetworkStatusText = () => {
    if (!isConnected) {
      return 'No network connection';
    }

    if (isInternetReachable === false) {
      return 'No internet access';
    }

    switch (connectionType) {
      case 'wifi':
        return 'WiFi connected';
      case 'cellular':
        return 'Mobile data connected';
      case 'bluetooth':
        return 'Bluetooth connected';
      case 'ethernet':
        return 'Ethernet connected';
      default:
        return 'Network connected';
    }
  };

  const getNetworkIcon = (): keyof typeof MaterialIcons.glyphMap => {
    if (!isConnected) return 'cloud-off';
    if (isInternetReachable === false) return 'wifi-off';

    switch (connectionType) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'signal-cellular-4-bar';
      case 'bluetooth':
        return 'bluetooth';
      case 'ethernet':
        return 'cable';
      default:
        return 'language';
    }
  };

  const getNetworkStatusColor = () => {
    if (!isConnected || isInternetReachable === false) {
      return theme.colors.error;
    }
    return theme.colors.success;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='fade'
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name='cloud-download'
              size={64}
              color={theme.colors.textSecondary}
            />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Download Chapter
          </Text>

          <Text
            style={[styles.bookName, { color: theme.colors.textSecondary }]}>
            {bookName}
          </Text>

          <Text
            style={[
              styles.chapterTitle,
              { color: theme.colors.textSecondary },
            ]}>
            {chapterTitle}
          </Text>

          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            Download to listen offline at your convenience.
          </Text>

          {/* Online Status Check */}
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}>
            {isCheckingOnline ? (
              <View style={styles.statusRow}>
                <ActivityIndicator size='small' color={theme.colors.primary} />
                <Text style={[styles.statusText, { color: theme.colors.text }]}>
                  Checking online capabilities...
                </Text>
              </View>
            ) : (
              <View style={styles.statusRow}>
                <MaterialIcons
                  name={isOnline ? 'check-circle' : 'error'}
                  size={20}
                  color={isOnline ? theme.colors.success : theme.colors.error}
                />
                <Text style={[styles.statusText, { color: theme.colors.text }]}>
                  {isOnline
                    ? 'Online - Searching for media files...'
                    : 'Offline'}
                </Text>
              </View>
            )}
          </View>

          {/* Search Results */}
          {isOnline && !isCheckingOnline && (
            <View
              style={[
                styles.resultsContainer,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}>
              {isSearching ? (
                <View style={styles.statusRow}>
                  <ActivityIndicator
                    size='small'
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[styles.statusText, { color: theme.colors.text }]}>
                    Searching for media files...
                  </Text>
                </View>
              ) : searchError ? (
                <View style={styles.statusRow}>
                  <MaterialIcons
                    name='error'
                    size={16}
                    color={theme.colors.error}
                  />
                  <Text
                    style={[styles.statusText, { color: theme.colors.error }]}>
                    {searchError}
                  </Text>
                </View>
              ) : searchResults.length > 0 ? (
                <View style={styles.resultsDetails}>
                  <View style={styles.statusRow}>
                    <MaterialIcons
                      name='cloud-download'
                      size={16}
                      color={theme.colors.success}
                    />
                    <Text
                      style={[styles.statusText, { color: theme.colors.text }]}>
                      Found {searchResults.length} media files
                    </Text>
                  </View>

                  {/* File details */}
                  <View style={styles.fileDetails}>
                    <Text
                      style={[
                        styles.fileDetailText,
                        { color: theme.colors.textSecondary },
                      ]}>
                      Total size: {formatFileSize(getTotalFileSize())}
                    </Text>
                    <Text
                      style={[
                        styles.fileDetailText,
                        { color: theme.colors.textSecondary },
                      ]}>
                      Files: {searchResults.length} audio files
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.statusRow}>
                  <MaterialIcons
                    name='cloud-off'
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: theme.colors.textSecondary },
                    ]}>
                    No media files found for this chapter
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Network Status with Refresh Button - Only show when no connection */}
          {(!isConnected || isInternetReachable === false) && (
            <View
              style={[
                styles.networkStatusContainer,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}>
              <View style={styles.networkStatusRow}>
                <MaterialIcons
                  name={getNetworkIcon()}
                  size={20}
                  color={getNetworkStatusColor()}
                />
                <Text
                  style={[
                    styles.networkStatusText,
                    { color: theme.colors.text },
                  ]}>
                  {getNetworkStatusText()}
                </Text>
              </View>
              <Text
                style={[
                  styles.networkExplanationText,
                  { color: theme.colors.textSecondary },
                ]}>
                Network connection is required to download media files
              </Text>
              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  { borderColor: theme.colors.border },
                ]}
                onPress={handleRefresh}
                disabled={isCheckingOnline || isSearching || isDownloading}>
                <MaterialIcons
                  name='refresh'
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.refreshButtonText,
                    { color: theme.colors.primary },
                  ]}>
                  Refresh
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {/* Download button - only show when files are found */}
            {searchResults.length > 0 && !isSearching && (
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  { backgroundColor: theme.colors.success },
                ]}
                onPress={handleDownload}
                disabled={isDownloading}>
                {isDownloading ? (
                  <ActivityIndicator
                    size='small'
                    color={theme.colors.textInverse}
                  />
                ) : (
                  <MaterialIcons
                    name='cloud-download'
                    size={20}
                    color={theme.colors.textInverse}
                  />
                )}
                <Text
                  style={[
                    styles.downloadButtonText,
                    { color: theme.colors.textInverse },
                  ]}>
                  {isDownloading ? 'Downloading...' : 'Download Files'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={onClose}
              disabled={isDownloading}>
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: theme.colors.textSecondary },
                ]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // This is a standard overlay color
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000', // This is a standard shadow color
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  resultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsDetails: {
    width: '100%',
  },
  fileDetails: {
    marginTop: 8,
    gap: 4,
  },
  fileDetailText: {
    fontSize: 12,
    fontWeight: '400',
  },
  networkStatusContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 32,
    gap: 12,
  },
  networkStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  networkStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  networkExplanationText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },

  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
