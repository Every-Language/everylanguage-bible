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
import { useDownloads } from '../hooks';
import { downloadService } from '../services';

interface UrlDownloadFormProps {
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
}

export const UrlDownloadForm: React.FC<UrlDownloadFormProps> = ({
  onDownloadStart,
  onDownloadComplete,
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
    if (!urls.trim()) {
      Alert.alert('Error', t('downloads.pleaseEnterUrl'));
      return;
    }

    if (!fileName.trim()) {
      Alert.alert('Error', t('downloads.pleaseEnterFileName'));
      return;
    }

    // Parse URLs (support multiple URLs separated by newlines or commas)
    const urlList = urls
      .split(/[\n,]/)
      .map(url => url.trim())
      .filter((url): url is string => url.length > 0);

    if (urlList.length === 0) {
      Alert.alert('Error', t('downloads.pleaseEnterValidUrl'));
      return;
    }

    // Validate URLs
    for (const url of urlList) {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(url)) {
        Alert.alert('Error', `Invalid URL: ${url}`);
        return;
      }
    }

    setIsProcessing(true);
    setStep('signing');
    onDownloadStart?.();

    try {
      // Step 1: Get signed URLs from the API
      console.log('📱 [UI] Starting URL signing process for URLs:', urlList);
      console.log('📱 [UI] Number of URLs to sign:', urlList.length);

      const signedUrlsResult =
        await downloadService.getSignedUrlsForExternalUrls(urlList, 24);

      console.log('📱 [UI] Signing result received:', {
        success: signedUrlsResult.success,
        totalFiles: signedUrlsResult.totalFiles,
        successfulUrls: signedUrlsResult.successfulUrls,
        fallback: signedUrlsResult.fallback,
      });

      if (!signedUrlsResult.success) {
        console.error('📱 [UI] Signing failed - success is false');
        throw new Error('Failed to get signed URLs');
      }

      if (signedUrlsResult.fallback) {
        console.warn(
          '📱 [UI] Using fallback URLs - signing API may be unavailable'
        );
      }

      setStep('downloading');

      // Step 2: Download each file
      for (let i = 0; i < urlList.length; i++) {
        const url = urlList[i];
        const signedUrl = signedUrlsResult.urls?.[url];

        if (!signedUrl) {
          console.error(`No signed URL found for: ${url}`);
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

          console.log('📱 [UI] Starting download for:', {
            originalUrl: url,
            signedUrl: signedUrl,
            fileName: individualFileName,
            filePath: filePath,
          });

          await downloadFile(filePath, individualFileName, {
            onProgress: progress => {
              console.log(
                `Download progress for ${individualFileName}: ${progress.progress * 100}%`
              );
            },
            onComplete: item => {
              console.log('Download completed:', item.fileName);
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
              console.error('Download failed:', error);
              Alert.alert('Download Failed', `${individualFileName}: ${error}`);
            },
          });
        } catch (error) {
          console.error(`Download error for ${individualFileName}:`, error);
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
      // Extract pathname from URL using regex
      const pathnameMatch = firstUrl.match(/https?:\/\/[^/]+(\/.*?)(?:\?|#|$)/);
      const pathname = pathnameMatch?.[1] || '/';
      const pathParts = pathname.split('/').filter(part => part.length > 0);
      const extractedName =
        pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'download';

      if (extractedName) {
        // Remove query parameters and hash
        const cleanName = extractedName.split('?')[0].split('#')[0];

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
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
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
          {
            backgroundColor: isFormValid
              ? theme.colors.primary
              : theme.colors.border,
          },
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

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
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
