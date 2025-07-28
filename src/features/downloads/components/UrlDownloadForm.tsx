import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { useTranslations } from '@/shared/context/LocalizationContext';
import { Theme } from '@/shared/types/theme';
import { useDownloads } from '../hooks';
import { urlSigningService } from '../services/urlSigningService';
import { logger } from '@/shared/utils/logger';

interface UrlDownloadFormProps {
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  // Add media file integration options
  addToMediaFiles?: boolean;
  originalSearchResults?: any[];
  mediaFileOptions?: any;
}

export const UrlDownloadForm: React.FC<UrlDownloadFormProps> = ({
  onDownloadComplete,
  addToMediaFiles = false,
  originalSearchResults = [],
  mediaFileOptions = {},
}) => {
  const { theme } = useTheme();
  const t = useTranslations();
  const { downloadFile, isLoading } = useDownloads();

  const [urls, setUrls] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'signing' | 'downloading'>(
    'input'
  );

  const handleGetSignedUrls = async () => {
    if (!urls.trim() || !fileName.trim()) {
      Alert.alert('Error', 'Please enter both URLs and file name');
      return;
    }

    setIsProcessing(true);
    setStep('downloading');

    try {
      const urlList = urls
        .split(/[\n,]/)
        .map(url => url.trim())
        .filter((url): url is string => url.length > 0);

      if (urlList.length === 0) {
        Alert.alert('Error', 'No valid URLs found');
        return;
      }

      // Step 1: Get signed URLs
      const signedUrlsResult =
        await urlSigningService.getSignedUrlsForExternalUrls(
          urlList,
          24 // 24 hours expiration
        );

      if (!signedUrlsResult.success || !signedUrlsResult.urls) {
        Alert.alert('Error', 'Failed to get signed URLs');
        return;
      }

      // Step 2: Download each file
      for (let i = 0; i < urlList.length; i++) {
        const url = urlList[i];
        if (!url) continue; // Skip if URL is undefined
        const signedUrl = signedUrlsResult.urls?.[url];

        if (!signedUrl) {
          logger.error(`No signed URL found for: ${url}`);
          continue;
        }

        const fileExtension = getFileExtension(url);
        const individualFileName =
          urlList.length === 1
            ? fileName
            : `${fileName}_${i + 1}${fileExtension}`;

        try {
          // Use the signed URL for download
          const filePath = `direct://${signedUrl}`;

          logger.info('Starting download for:', {
            originalUrl: url,
            signedUrl: signedUrl,
            fileName: individualFileName,
            filePath: filePath,
          });

          await downloadFile(filePath, individualFileName, {
            onProgress: progress => {
              logger.debug(
                `Download progress for ${individualFileName}: ${progress.progress * 100}%`
              );
            },
            onComplete: item => {
              logger.info('Download completed:', item.fileName);
              if (i === urlList.length - 1) {
                // Last file completed
                Alert.alert(
                  'Success',
                  t('downloads.downloadSuccess', {
                    fileName: individualFileName,
                  })
                );
                setUrls('');
                setFileName('');
                onDownloadComplete?.();
              }
            },
            onError: error => {
              logger.error('Download failed:', error);
              Alert.alert('Download Failed', `${individualFileName}: ${error}`);
            },
            // Add media file integration options
            addToMediaFiles,
            originalSearchResult:
              originalSearchResults[i] || originalSearchResults[0],
            mediaFileOptions,
          });
        } catch (error) {
          logger.error(`Download error for ${individualFileName}:`, error);
          Alert.alert(
            'Error',
            `Failed to download ${individualFileName}: ${(error as Error).message}`
          );
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to get signed URLs: ${(error as Error).message}`
      );
    } finally {
      setIsProcessing(false);
      setStep('input');
    }
  };

  const getFileExtension = (url: string): string => {
    try {
      // Simple regex to extract file extension from URL
      const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      const extension = match?.[1]?.toLowerCase();

      if (
        extension &&
        ['mp3', 'm4a', 'wav', 'aac', 'ogg'].includes(extension)
      ) {
        return `.${extension}`;
      }
    } catch {
      // If parsing fails, return default extension
    }
    return '.mp3'; // Default extension
  };

  const extractFileNameFromUrl = () => {
    if (!urls.trim()) return;

    try {
      const urlList = urls
        .split(/[\n,]/)
        .map(url => url.trim())
        .filter((url): url is string => url.length > 0);
      if (urlList.length === 0) return;

      const firstUrl = urlList[0];
      if (!firstUrl) return; // Additional safety check

      // Extract pathname from URL using regex
      const pathnameMatch = firstUrl.match(/https?:\/\/[^/]+(\/.*?)(?:\?|#|$)/);
      const pathname = pathnameMatch?.[1] || '/';
      const pathParts = pathname.split('/').filter(part => part.length > 0);
      const lastPart = pathParts[pathParts.length - 1];
      const extractedName = lastPart || 'download';

      if (extractedName && extractedName !== 'download') {
        // Remove query parameters and hash
        const cleanName = extractedName.split('?')[0]?.split('#')[0];

        if (cleanName && cleanName !== '') {
          // Remove file extension for the base name
          const baseName = cleanName.split('.').slice(0, -1).join('.');
          setFileName(baseName || 'download');
        }
      }
    } catch {
      // If URL is invalid, don't extract filename
    }
  };

  const getStepText = () => {
    switch (step) {
      case 'signing':
        return t('downloads.signingUrls');
      case 'downloading':
        return t('downloads.downloadingFiles');
      default:
        return t('downloads.downloadFile');
    }
  };

  const isFormValid = urls.trim() !== '' && fileName.trim() !== '';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
        },
      ]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t('downloads.downloadFromUrl')}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('downloads.urls')}
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          value={urls}
          onChangeText={setUrls}
          placeholder={t('downloads.urlsPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize='none'
          autoCorrect={false}
          multiline
          numberOfLines={4}
          textAlignVertical='top'
          onBlur={extractFileNameFromUrl}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('downloads.baseFileName')}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          value={fileName}
          onChangeText={setFileName}
          placeholder={t('downloads.fileNamePlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize='none'
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.downloadButton,
          getDownloadButtonStyle(
            theme,
            isFormValid,
            !isFormValid || isProcessing || isLoading
          ),
        ]}
        onPress={handleGetSignedUrls}
        disabled={!isFormValid || isProcessing || isLoading}>
        {isProcessing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.textInverse} size='small' />
            <Text
              style={[styles.loadingText, { color: theme.colors.textInverse }]}>
              {getStepText()}
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.downloadButtonText,
              { color: theme.colors.textInverse },
            ]}>
            {t('downloads.getSignedUrlsAndDownload')}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
        {t('downloads.urlHelpText')}
      </Text>
    </View>
  );
};

const getDownloadButtonStyle = (
  theme: Theme,
  isFormValid: boolean,
  isDisabled: boolean
) => ({
  backgroundColor: isDisabled
    ? theme.colors.border
    : isFormValid
      ? theme.colors.primary
      : theme.colors.border,
  opacity: isDisabled ? 0.6 : 1,
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  downloadButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
