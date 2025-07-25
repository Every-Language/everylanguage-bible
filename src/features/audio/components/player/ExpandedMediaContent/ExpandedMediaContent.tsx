import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme, useAudioStore } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';
import { ToggleButtons } from '@/shared/components/ui';
import { getBookImageSource } from '@/shared/services';
import { bookService } from '@/features/bible/services/domain/bookService';
import { Fonts } from '@/shared/constants';
import { ContentSwitcher } from '../ContentSwitcher';
import { createExpandedMediaContentStyles } from './ExpandedMediaContent.styles';

// Content mode types
type ContentMode = 'text' | 'queue';

export interface ExpandedMediaContentProps {
  onTextPress?: () => void;
  onQueuePress?: () => void;
  onVersionPress?: () => void;
  onVersePress?: (verseNumber: number) => void;
  onSeek?: (time: number) => void;
  currentMode?: ContentMode;
  slideAnimation?: Animated.SharedValue<number> | undefined;
}

export const ExpandedMediaContent: React.FC<ExpandedMediaContentProps> = ({
  onTextPress,
  onQueuePress,
  onVersionPress,
  onVersePress,
  onSeek,
  currentMode = 'text',
  slideAnimation,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = createExpandedMediaContentStyles(colors, isDark);

  // Get data from audio store
  const {
    currentRecording,
    currentChapter,
    currentTime,
    currentVerseDisplayData,
  } = useAudioStore();

  // Get chapter info
  const title =
    currentChapter?.bookName ||
    currentRecording?.title ||
    t('audio.unknownBook', 'Unknown Book');
  const subtitle = currentChapter
    ? `Chapter ${currentChapter.chapterNumber}`
    : t('audio.unknownChapter', 'Unknown Chapter');

  // Render book image using the service
  const renderBookImage = () => {
    const bookName = currentChapter?.bookName || title;
    const imagePath = bookService.getImagePath(bookName);

    if (imagePath) {
      const imageSource = getBookImageSource(imagePath);
      if (imageSource) {
        return (
          <Image
            source={imageSource}
            style={styles.bookImage}
            resizeMode='contain'
          />
        );
      }
    }

    // Fallback to book emoji
    return (
      <View style={styles.fallbackImageContainer}>
        <Text style={styles.fallbackEmoji}>📖</Text>
      </View>
    );
  };

  return (
    <View
      style={styles.container}
      testID='expanded-media-content'
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={() => {
        // Prevent scroll events from falling through by capturing them
      }}>
      {/* Book Info Row */}
      <View style={styles.bookInfoRow}>
        {/* Book Icon */}
        {renderBookImage()}

        {/* Book Name and Chapter */}
        <View style={styles.bookTextContainer}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.bookSubtitle}>{subtitle}</Text>

          {/* Version Text */}
          <TouchableOpacity
            onPress={onVersionPress}
            style={styles.versionContainer}>
            <Text style={styles.versionText}>
              {t('audio.versionText', 'Midwest English - CLB')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Text and Queue Buttons Row */}
      <View style={styles.toggleButtonsContainer}>
        <ToggleButtons<ContentMode>
          options={[
            { key: 'text', label: t('audio.text', 'Text') },
            { key: 'queue', label: t('audio.queue', 'Queue') },
          ]}
          selectedKey={currentMode}
          onSelect={(key: ContentMode) => {
            if (key === 'text') {
              onTextPress?.();
            } else if (key === 'queue') {
              onQueuePress?.();
            }
          }}
          testID='expanded-mode-toggle'
          height={24}
          fontSize={Fonts.size.sm}
        />
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        <ContentSwitcher
          mode={currentMode}
          verseDisplayData={currentVerseDisplayData}
          currentTime={currentTime}
          onVersePress={onVersePress}
          onSeek={onSeek}
          title={title}
          subtitle={subtitle}
          slideAnimation={slideAnimation}
        />
      </View>
    </View>
  );
};
