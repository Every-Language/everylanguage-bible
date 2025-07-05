import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions as RNDimensions,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';
import {
  PlayIcon,
  PauseIcon,
  PreviousChapterIcon,
  PreviousVerseIcon,
  NextVerseIcon,
  NextChapterIcon,
} from '@/shared/components/ui/icons/AudioIcons';
import { getBookImageSource } from '@/shared/services';
import { useAudioStore } from '@/shared/store/audioStore';
import { VerseDisplayData } from '@/types/audio';

interface MiniPlayerProps {
  testID?: string;
  onExpand?: () => void;
  onClose?: () => void; // Close/hide the player
  // All other data now comes from the audio store
}

// Content mode types
type ContentMode = 'text' | 'queue';

// Text mode component - now uses data from audio store
interface TextModeViewProps {
  verseDisplayData: VerseDisplayData[];
  currentTime: number;
  onVersePress?: ((verseNumber: number) => void) | undefined;
  onSeek?: ((time: number) => void) | undefined;
}

const TextModeView: React.FC<TextModeViewProps> = ({
  verseDisplayData,
  currentTime: _currentTime,
  onVersePress,
  onSeek,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const versePositions = React.useRef<Map<number, number>>(new Map());
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);

  // Find current verse from display data
  const currentVerse = React.useMemo(() => {
    const activeVerse = verseDisplayData.find(verse => verse.isCurrentVerse);
    return activeVerse?.verseNumber || 1;
  }, [verseDisplayData]);

  // Handle verse layout to track positions
  const handleVerseLayout = (verseNumber: number, y: number) => {
    versePositions.current.set(verseNumber, y);
  };

  // Auto-scroll to current verse
  React.useEffect(() => {
    if (currentVerse && scrollViewRef.current && shouldAutoScroll) {
      const versePosition = versePositions.current.get(currentVerse);
      if (versePosition !== undefined) {
        // Add a small delay to ensure the ScrollView is ready
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, versePosition - 100), // Offset to show verse with some padding
            animated: true,
          });
        }, 100);
      }
    }
  }, [currentVerse, shouldAutoScroll]);

  // Disable auto-scroll when user manually scrolls
  const handleScrollBegin = () => {
    setShouldAutoScroll(false);
  };

  // Re-enable auto-scroll after user stops scrolling for a while
  const handleScrollEnd = () => {
    // Re-enable auto-scroll after 3 seconds of no scrolling
    setTimeout(() => {
      setShouldAutoScroll(true);
    }, 3000);
  };

  if (verseDisplayData.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: Fonts.size.lg,
            color: colors.text,
            textAlign: 'center',
            marginBottom: Dimensions.spacing.md,
          }}>
          {t('audio.textMode', 'Text Mode')}
        </Text>
        <Text
          style={{
            fontSize: Fonts.size.base,
            color: colors.text + '80',
            textAlign: 'center',
          }}>
          {t('audio.noVerseText', 'No verse text available')}
        </Text>
      </View>
    );
  }

  const handleVersePress = (verseNumber: number) => {
    console.log(`Verse ${verseNumber} tapped`);

    // Find the verse and seek to its start time
    const verse = verseDisplayData.find(v => v.verseNumber === verseNumber);
    if (verse && onSeek) {
      console.log(
        `Seeking to verse ${verseNumber} at time ${verse.startTime}s`
      );
      onSeek(verse.startTime);
    }

    // Also call the verse press callback
    onVersePress?.(verseNumber);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Dimensions.spacing.md }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps='handled'
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}>
        {verseDisplayData.map(verse => {
          return (
            <TouchableOpacity
              key={verse.verseNumber}
              style={{
                marginBottom: Dimensions.spacing.md,
                padding: Dimensions.spacing.sm,
                backgroundColor: verse.isCurrentVerse
                  ? colors.primary + '20'
                  : 'transparent',
                borderRadius: Dimensions.radius.md,
                borderWidth: verse.isCurrentVerse ? 2 : 0,
                borderColor: verse.isCurrentVerse
                  ? colors.primary
                  : 'transparent',
              }}
              onPress={() => handleVersePress(verse.verseNumber)}
              activeOpacity={0.7}
              onLayout={event => {
                const { y } = event.nativeEvent.layout;
                handleVerseLayout(verse.verseNumber, y);
              }}>
              <View style={{ marginBottom: Dimensions.spacing.xs }}>
                <Text
                  style={{
                    fontSize: Fonts.size.sm,
                    fontWeight: Fonts.weight.bold,
                    color: verse.isCurrentVerse
                      ? colors.primary
                      : colors.text + '80',
                  }}>
                  Verse {verse.verseNumber}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: Fonts.size.base,
                  lineHeight: 24,
                  color: verse.isCurrentVerse
                    ? colors.text
                    : colors.text + '90',
                  fontWeight: verse.isCurrentVerse
                    ? Fonts.weight.medium
                    : Fonts.weight.normal,
                }}>
                {verse.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Queue mode component
interface QueueModeViewProps {
  title?: string | undefined;
  subtitle?: string | undefined;
}

const QueueModeView: React.FC<QueueModeViewProps> = ({
  title: _title,
  subtitle: _subtitle,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: Fonts.size.lg,
          color: colors.text,
          textAlign: 'center',
          marginBottom: Dimensions.spacing.md,
        }}>
        {t('audio.queueMode', 'Queue Mode')}
      </Text>
      <Text
        style={{
          fontSize: Fonts.size.base,
          color: colors.text + '80',
          textAlign: 'center',
        }}>
        {t(
          'audio.queueModeDescription',
          'Audio queue and playlist will appear here'
        )}
      </Text>
    </View>
  );
};

// Content switcher with animation
interface ContentSwitcherProps {
  mode: ContentMode;
  verseDisplayData: VerseDisplayData[];
  currentTime: number;
  onVersePress?: ((verseNumber: number) => void) | undefined;
  onSeek?: ((time: number) => void) | undefined;
  title?: string;
  subtitle?: string;
}

const ContentSwitcher: React.FC<ContentSwitcherProps> = ({
  mode,
  verseDisplayData,
  currentTime,
  onVersePress,
  onSeek,
  title,
  subtitle,
}) => {
  const slideAnimation = useSharedValue(0);

  // Update animation when mode changes
  React.useEffect(() => {
    slideAnimation.value = withTiming(mode === 'text' ? 0 : 1, {
      duration: 300,
    });
  }, [mode, slideAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${slideAnimation.value * -50}%` }],
  }));

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            width: '200%',
            height: '100%',
          },
          animatedStyle,
        ]}>
        <View style={{ width: '50%', height: '100%' }}>
          <TextModeView
            verseDisplayData={verseDisplayData}
            currentTime={currentTime}
            onVersePress={onVersePress}
            onSeek={onSeek}
          />
        </View>
        <View style={{ width: '50%', height: '100%' }}>
          <QueueModeView title={title} subtitle={subtitle} />
        </View>
      </Animated.View>
    </View>
  );
};

// Expanded media content component
interface ExpandedMediaContentProps {
  onTextPress?: () => void;
  onQueuePress?: () => void;
  onVersionPress?: () => void;
  onVersePress?: (verseNumber: number) => void;
  onSeek?: (time: number) => void;
}

const ExpandedMediaContent: React.FC<ExpandedMediaContentProps> = ({
  onTextPress,
  onQueuePress,
  onVersionPress,
  onVersePress,
  onSeek,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Get data from audio store
  const {
    currentRecording,
    currentChapter,
    currentTime,
    currentVerseDisplayData,
  } = useAudioStore();

  // Mode state
  const [currentMode, setCurrentMode] = useState<ContentMode>('text');

  // Get chapter info
  const title =
    currentChapter?.bookName ||
    currentRecording?.title ||
    t('audio.unknownBook', 'Unknown Book');
  const subtitle = currentChapter
    ? `Chapter ${currentChapter.chapterNumber}`
    : t('audio.unknownChapter', 'Unknown Chapter');

  // Convert book name to image path
  const getImagePathFromBookName = (bookName: string): string | undefined => {
    // This could be enhanced to use a mapping service
    return `${bookName.toLowerCase().replace(/\s+/g, '_')}.png`;
  };

  // Render book image
  const renderBookImage = () => {
    const bookName = currentChapter?.bookName || title;
    const imagePath = getImagePathFromBookName(bookName);

    if (imagePath) {
      const imageSource = getBookImageSource(imagePath);
      if (imageSource) {
        return (
          <Image
            source={imageSource}
            style={{
              width: 100,
              height: 100,
              borderRadius: Dimensions.radius.md,
              tintColor: colors.text,
            }}
            resizeMode='contain'
          />
        );
      }
    }

    // Fallback to book emoji
    return (
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: Dimensions.radius.md,
          backgroundColor: colors.secondary + '30',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{ fontSize: 48, color: colors.text }}>📖</Text>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        margin: 0,
        padding: Dimensions.spacing.md,
        backgroundColor: colors.background,
      }}
      testID='expanded-media-content'>
      {/* Book Info Row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: Dimensions.spacing.md,
        }}>
        {/* Book Icon */}
        {renderBookImage()}

        {/* Book Name and Chapter */}
        <View style={{ marginLeft: Dimensions.spacing.sm, flex: 1 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: Fonts.weight.bold,
              color: colors.text,
            }}
            numberOfLines={1}>
            {title}
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: Fonts.weight.bold,
              color: colors.text,
              marginTop: 2,
            }}>
            {subtitle}
          </Text>

          {/* Version Text */}
          <TouchableOpacity
            onPress={onVersionPress}
            style={{ marginTop: Dimensions.spacing.xs }}>
            <Text
              style={{
                fontSize: Fonts.size.sm,
                color: colors.text + '60', // Fainter text
                textAlign: 'left',
              }}>
              {t('audio.versionText', 'Midwest English - CLB')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Text and Queue Buttons Row */}
      <View
        style={{
          flexDirection: 'row',
          gap: Dimensions.spacing.md,
        }}>
        {/* Text Button */}
        <TouchableOpacity
          style={{
            flex: 1,
            height: 28,
            backgroundColor:
              currentMode === 'text' ? colors.primary : colors.primary + '20',
            borderRadius: Dimensions.radius.md,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.primary,
          }}
          onPress={() => {
            setCurrentMode('text');
            onTextPress?.();
          }}
          testID='expanded-text-button'>
          <Text
            style={{
              fontSize: Fonts.size.base,
              fontWeight: Fonts.weight.medium,
              color:
                currentMode === 'text' ? colors.background : colors.primary,
            }}>
            {t('audio.text', 'Text')}
          </Text>
        </TouchableOpacity>

        {/* Queue Button */}
        <TouchableOpacity
          style={{
            flex: 1,
            height: 28,
            backgroundColor:
              currentMode === 'queue' ? colors.primary : colors.primary + '20',
            borderRadius: Dimensions.radius.md,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.primary,
          }}
          onPress={() => {
            setCurrentMode('queue');
            onQueuePress?.();
          }}
          testID='expanded-queue-button'>
          <Text
            style={{
              fontSize: Fonts.size.base,
              fontWeight: Fonts.weight.medium,
              color:
                currentMode === 'queue' ? colors.background : colors.primary,
            }}>
            {t('audio.queue', 'Queue')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={{ flex: 1, marginTop: Dimensions.spacing.md }}>
        <ContentSwitcher
          mode={currentMode}
          verseDisplayData={currentVerseDisplayData}
          currentTime={currentTime}
          onVersePress={onVersePress}
          onSeek={onSeek}
          title={title}
          subtitle={subtitle}
        />
      </View>
    </View>
  );
};

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  testID,
  onExpand: _onExpand,
  onClose: _onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Get all data from audio store
  const {
    currentRecording,
    currentChapter,
    currentTime,
    totalTime,
    isPlaying,
    playbackSpeed,
    // Actions
    seek,
    previousVerse,
    nextVerse,
    playPrevious,
    playNext,
    togglePlayPause,
  } = useAudioStore();

  // Expansion state management
  const [isExpanded, setIsExpanded] = useState(false);
  const screenHeight = RNDimensions.get('window').height;

  // Version popup state
  const [showVersionPopup, setShowVersionPopup] = useState(false);

  // Speed menu state
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const expansionValue = useSharedValue(0);

  // Handle expand/contract functionality
  const handleExpandContractPress = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    if (newExpanded) {
      // Expand
      expansionValue.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
    } else {
      // Contract
      expansionValue.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
    }
  };

  // Get display text from audio store data
  const displayText = () => {
    const title = currentChapter?.bookName || currentRecording?.title;
    const subtitle = currentChapter
      ? `Chapter ${currentChapter.chapterNumber}`
      : '';

    if (title && subtitle) {
      return `${title} ${subtitle}`;
    }
    return title || t('audio.noAudioSelected');
  };

  // Version text component
  const VersionText: React.FC<{ style?: any }> = ({ style }) => (
    <TouchableOpacity onPress={() => setShowVersionPopup(true)}>
      <Text
        style={[
          {
            fontSize: Fonts.size.sm,
            color: colors.text + '60', // Fainter text
            textAlign: 'right',
          },
          style,
        ]}>
        {t('audio.versionText', 'Midwest English - CLB')}
      </Text>
    </TouchableOpacity>
  );

  // Speed control component
  const SpeedControl: React.FC<{ style?: any }> = ({ style }) => {
    return (
      <TouchableOpacity onPress={() => setShowSpeedMenu(true)} style={style}>
        <Text
          style={{
            fontSize: Fonts.size.lg,
            fontWeight: Fonts.weight.bold,
            color: colors.text,
            textAlign: 'right',
          }}>
          {playbackSpeed}x
        </Text>
      </TouchableOpacity>
    );
  };

  // Handle verse press - navigation handled by audio store
  const handleVersePress = (verseNumber: number) => {
    console.log(
      `Verse ${verseNumber} tapped - seeking handled by TextModeView`
    );
  };

  // Calculate the height of the bottom controls section
  const bottomControlsHeight = 190; // Increased height for all controls: expand bar + title + progress + buttons + padding

  // Container animation - expands from bottom to fill most of screen
  const animatedContainerStyle = useAnimatedStyle(() => {
    const expansion = expansionValue.value;

    if (expansion === 0) {
      // Collapsed state - container extends to bottom of screen, content above safe area
      return {
        position: 'absolute',
        bottom: 0, // Extend to bottom of screen
        left: 0,
        right: 0,
        height: bottomControlsHeight + insets.bottom, // Add safe area to height
      };
    } else {
      // Expanded state - fills from top safe area to bottom of screen
      const expandedHeight = screenHeight - insets.top;
      const currentHeight =
        bottomControlsHeight +
        insets.bottom +
        (expandedHeight - (bottomControlsHeight + insets.bottom)) * expansion;

      return {
        position: 'absolute',
        bottom: 0, // Extend to bottom of screen
        left: 0,
        right: 0,
        height: currentHeight,
      };
    }
  });

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderRightWidth: 2,
      borderTopColor: colors.primary,
      borderLeftColor: colors.primary,
      borderRightColor: colors.primary,
      borderTopLeftRadius: Dimensions.radius.xl,
      borderTopRightRadius: Dimensions.radius.xl,
      ...Dimensions.shadow.lg,
      zIndex: 1000,
      opacity: 1, // Always 100% opaque
      flexDirection: 'column',
    },
    expandContractTouchArea: {
      paddingVertical: Dimensions.spacing.md,
      paddingHorizontal: Dimensions.spacing.xl,
      alignSelf: 'center',
    },
    expandContractBar: {
      width: 100,
      height: 5,
      backgroundColor: '#666666',
      borderRadius: 2.5,
      alignSelf: 'center',
    },
    middleArea: {
      flex: 1,
      backgroundColor: colors.background,
      // This area can be used for additional content when expanded
    },
    bottomControlsContainer: {
      paddingHorizontal: Dimensions.spacing.md,
      paddingTop: Dimensions.spacing.sm, // Reduced from md to sm for less space between expand bar and title
      paddingBottom: Dimensions.spacing.md + insets.bottom, // Add safe area padding back
      backgroundColor: colors.background,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.sm,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: Fonts.size.base,
      fontWeight: Fonts.weight.medium,
      color: colors.text,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: Dimensions.spacing.lg,
    },
    circularButton: {
      width: Dimensions.component.controlButton.width,
      height: Dimensions.component.controlButton.height,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: Dimensions.radius.full,
    },
    primaryButton: {
      width: Dimensions.component.primaryControlButton.width,
      height: Dimensions.component.primaryControlButton.height,
    },
  });

  return (
    <Animated.View
      style={[styles.container, animatedContainerStyle]}
      testID={testID}
      accessibilityLabel={t('audio.audioPlayerControls')}>
      {/* Expand/Contract Bar - Always at the top of the container */}
      <TouchableOpacity
        style={styles.expandContractTouchArea}
        onPress={handleExpandContractPress}
        testID='mini-player-expand-contract-bar'
        accessibilityLabel={
          isExpanded ? t('audio.contractPlayer') : t('audio.expandPlayer')
        }
        accessibilityRole='button'>
        <View style={styles.expandContractBar} />
      </TouchableOpacity>

      {/* Middle Area - Only visible when expanded */}
      {isExpanded && (
        <View style={styles.middleArea}>
          <ExpandedMediaContent
            onTextPress={() => {}}
            onQueuePress={() => {}}
            onVersionPress={() => setShowVersionPopup(true)}
            onVersePress={handleVersePress}
            onSeek={seek}
          />
        </View>
      )}

      {/* Bottom Controls - Fixed at bottom of container */}
      <View style={styles.bottomControlsContainer}>
        {/* Top Row: Text and Version/Speed */}
        <View style={styles.topRow}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {displayText()}
            </Text>
          </View>
          {!isExpanded && (
            <VersionText style={{ marginLeft: Dimensions.spacing.sm }} />
          )}
          {isExpanded && (
            <SpeedControl style={{ marginLeft: Dimensions.spacing.xs }} />
          )}
        </View>

        {/* Progress Bar */}
        <ProgressBar
          currentTime={currentTime}
          totalTime={totalTime}
          onSeek={seek}
          seekable={totalTime > 0}
          testID='mini-player-progress'
        />

        {/* Five Circular Control Buttons */}
        <View style={styles.controlsRow}>
          {/* Previous Chapter - « */}
          <TouchableOpacity
            onPress={playPrevious}
            style={[
              styles.circularButton,
              { backgroundColor: colors.primary + '20' },
            ]}
            testID='mini-player-previous-chapter'
            accessibilityLabel={t('audio.previousChapter')}>
            <PreviousChapterIcon size={20} color={colors.primary} />
          </TouchableOpacity>

          {/* Previous Verse - ‹ */}
          <TouchableOpacity
            onPress={previousVerse}
            style={[
              styles.circularButton,
              { backgroundColor: colors.primary + '20' },
            ]}
            testID='mini-player-previous-verse'
            accessibilityLabel={t('audio.previousVerse')}>
            <PreviousVerseIcon size={20} color={colors.primary} />
          </TouchableOpacity>

          {/* Play/Pause - Center button */}
          <TouchableOpacity
            onPress={togglePlayPause}
            style={[
              styles.circularButton,
              styles.primaryButton,
              { backgroundColor: colors.primary },
            ]}
            testID='mini-player-play-pause'
            accessibilityLabel={isPlaying ? t('audio.pause') : t('audio.play')}>
            {isPlaying ? (
              <PauseIcon size={28} color={colors.background} />
            ) : (
              <PlayIcon size={28} color={colors.background} />
            )}
          </TouchableOpacity>

          {/* Next Verse - › */}
          <TouchableOpacity
            onPress={nextVerse}
            style={[
              styles.circularButton,
              { backgroundColor: colors.primary + '20' },
            ]}
            testID='mini-player-next-verse'
            accessibilityLabel={t('audio.nextVerse')}>
            <NextVerseIcon size={20} color={colors.primary} />
          </TouchableOpacity>

          {/* Next Chapter - » */}
          <TouchableOpacity
            onPress={playNext}
            style={[
              styles.circularButton,
              { backgroundColor: colors.primary + '20' },
            ]}
            testID='mini-player-next-chapter'
            accessibilityLabel={t('audio.nextChapter')}>
            <NextChapterIcon size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Version Change Popup */}
      <Modal
        visible={showVersionPopup}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowVersionPopup(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowVersionPopup(false)}>
          <View
            style={{
              backgroundColor: colors.background,
              padding: Dimensions.spacing.xl,
              borderRadius: Dimensions.radius.lg,
              margin: Dimensions.spacing.xl,
              maxWidth: '80%',
            }}>
            <Text
              style={{
                fontSize: Fonts.size.lg,
                fontWeight: Fonts.weight.bold,
                color: colors.text,
                textAlign: 'center',
                marginBottom: Dimensions.spacing.md,
              }}>
              {t('audio.versionChange', 'Version Change')}
            </Text>
            <Text
              style={{
                fontSize: Fonts.size.base,
                color: colors.text,
                textAlign: 'center',
                marginBottom: Dimensions.spacing.lg,
              }}>
              {t(
                'audio.versionChangePending',
                'Version change feature pending'
              )}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                padding: Dimensions.spacing.md,
                borderRadius: Dimensions.radius.md,
                alignItems: 'center',
              }}
              onPress={() => setShowVersionPopup(false)}>
              <Text
                style={{
                  color: colors.background,
                  fontSize: Fonts.size.base,
                  fontWeight: Fonts.weight.medium,
                }}>
                {t('common.ok', 'OK')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Speed Change Menu */}
      <Modal
        visible={showSpeedMenu}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowSpeedMenu(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowSpeedMenu(false)}>
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: Dimensions.radius.lg,
              margin: Dimensions.spacing.xl,
              maxWidth: '60%',
              minWidth: '40%',
            }}>
            <Text
              style={{
                fontSize: Fonts.size.lg,
                fontWeight: Fonts.weight.bold,
                color: colors.text,
                textAlign: 'center',
                padding: Dimensions.spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.text + '20',
              }}>
              {t('audio.playbackSpeed', 'Playback Speed')}
            </Text>

            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
              <TouchableOpacity
                key={speed}
                style={{
                  padding: Dimensions.spacing.md,
                  backgroundColor:
                    playbackSpeed === speed
                      ? colors.primary + '20'
                      : 'transparent',
                }}
                onPress={() => {
                  // TODO: Implement speed change in audio store
                  console.log(`Setting speed to ${speed}x`);
                  setShowSpeedMenu(false);
                }}>
                <Text
                  style={{
                    fontSize: Fonts.size.base,
                    color:
                      playbackSpeed === speed ? colors.primary : colors.text,
                    textAlign: 'center',
                    fontWeight:
                      playbackSpeed === speed
                        ? Fonts.weight.bold
                        : Fonts.weight.normal,
                  }}>
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
};
