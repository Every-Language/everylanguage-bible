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
import { loadBibleBooks } from '@/shared/utils';

// Verse data structure
interface Verse {
  verseNumber: number;
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

interface MiniPlayerProps {
  title?: string;
  subtitle?: string;
  imagePath?: string;
  isPlaying?: boolean;
  currentTime?: number; // in seconds
  totalTime?: number; // in seconds
  currentVerse?: number; // Current verse number
  onPlayPause?: () => void;
  onPreviousChapter?: () => void;
  onNextChapter?: () => void;
  onPreviousVerse?: () => void;
  onNextVerse?: () => void;
  onSeek?: (time: number) => void;
  onVersePress?: (verseNumber: number) => void; // Jump to specific verse
  onExpand?: () => void;
  onClose?: () => void; // Close/hide the player
  testID?: string;
  // Expanded content props
  onTextPress?: () => void;
  onQueuePress?: () => void;
  playbackSpeed?: number; // Current playback speed (e.g., 1.0, 1.5, 2.0)
  onSpeedChange?: (speed: number) => void;
}

// Content mode types
type ContentMode = 'text' | 'queue';

// Mock verse data generator
const generateMockVerses = (
  bookName: string,
  chapterNumber: number
): Verse[] => {
  const verseTexts = [
    'In the beginning God created the heaven and the earth.',
    'And the earth was without form, and void; and darkness was upon the face of the deep.',
    'And the Spirit of God moved upon the face of the waters.',
    'And God said, Let there be light: and there was light.',
    'And God saw the light, that it was good: and God divided the light from the darkness.',
    'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.',
    'And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.',
    'And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.',
    'And God called the firmament Heaven. And the evening and the morning were the second day.',
    'And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.',
    'And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.',
    'And God said, Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth: and it was so.',
    'And the earth brought forth grass, and herb yielding seed after his kind, and the tree yielding fruit, whose seed was in itself, after his kind: and God saw that it was good.',
    'And the evening and the morning were the third day.',
    'And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years.',
    'And let them be for lights in the firmament of the heaven to give light upon the earth: and it was so.',
    'And God made two great lights; the greater light to rule the day, and the lesser light to rule the night: he made the stars also.',
    'And God set them in the firmament of the heaven to give light upon the earth.',
    'And to rule over the day and over the night, and to divide the light from the darkness: and God saw that it was good.',
    'And the evening and the morning were the fourth day.',
    'And God said, Let the waters bring forth abundantly the moving creature that hath life, and fowl that may fly above the earth in the open firmament of heaven.',
    'And God created great whales, and every living creature that moveth, which the waters brought forth abundantly, after their kind, and every winged fowl after his kind: and God saw that it was good.',
    'And God blessed them, saying, Be fruitful, and multiply, and fill the waters in the seas, and let fowl multiply in the earth.',
    'And the evening and the morning were the fifth day.',
    'And God said, Let the earth bring forth the living creature after his kind, cattle, and creeping thing, and beast of the earth after his kind: and it was so.',
    'And God made the beast of the earth after his kind, and cattle after their kind, and every thing that creepeth upon the earth after his kind: and God saw that it was good.',
    'And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth.',
    'So God created man in his own image, in the image of God created he him; male and female created he them.',
    'And God blessed them, and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it: and have dominion over the fish of the sea, and over the fowl of the air, and over every living thing that moveth upon the earth.',
    'And God said, Behold, I have given you every herb bearing seed, which is upon the face of all the earth, and every tree, in the which is the fruit of a tree yielding seed; to you it shall be for meat.',
    'And to every beast of the earth, and to every fowl of the air, and to every thing that creepeth upon the earth, wherein there is life, I have given every green herb for meat: and it was so.',
    'And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.',
  ];

  // Generate verses based on chapter (vary count by chapter)
  const baseVerseCount = 20 + (chapterNumber % 12); // 20-31 verses per chapter
  const actualVerseCount = Math.min(baseVerseCount, verseTexts.length);

  return Array.from({ length: actualVerseCount }, (_, i) => {
    const verseNumber = i + 1;
    const avgSecondsPerVerse = 25; // Average verse length
    const startTime = i * avgSecondsPerVerse;
    const endTime = startTime + avgSecondsPerVerse;
    const textIndex = (i + chapterNumber * 7) % verseTexts.length; // Vary by chapter

    return {
      verseNumber,
      text: verseTexts[textIndex] || 'Default verse text', // Ensure text is never undefined
      startTime,
      endTime,
    };
  });
};

// Text mode component
interface TextModeViewProps {
  title?: string | undefined;
  subtitle?: string | undefined;
  currentVerse?: number | undefined;
  currentTime?: number | undefined; // Add current time for calculating current verse
  onVersePress?: ((verseNumber: number) => void) | undefined;
  onSeek?: ((time: number) => void) | undefined; // Add seek callback
}

const TextModeView: React.FC<TextModeViewProps> = ({
  title,
  subtitle,
  currentVerse: _currentVerse, // Keep as fallback
  currentTime = 0,
  onVersePress,
  onSeek,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const versePositions = React.useRef<Map<number, number>>(new Map());
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);

  // Generate verses based on current book and chapter
  const verses = React.useMemo(() => {
    if (!title || !subtitle) return [];

    const bookName = title;
    const chapterNumber = parseInt(subtitle.replace('Chapter ', ''), 10) || 1;

    return generateMockVerses(bookName, chapterNumber);
  }, [title, subtitle]);

  // Calculate current verse based on audio position
  const currentVerse = React.useMemo(() => {
    if (verses.length === 0) return _currentVerse || 1;

    // Find the verse that contains the current time
    const activeVerse = verses.find(
      verse => currentTime >= verse.startTime && currentTime < verse.endTime
    );

    if (activeVerse) {
      return activeVerse.verseNumber;
    }

    // If no exact match, find the closest verse
    const firstVerse = verses[0];
    if (firstVerse && currentTime <= firstVerse.startTime) {
      return firstVerse.verseNumber;
    }

    const lastVerse = verses[verses.length - 1];
    if (lastVerse && currentTime >= lastVerse.endTime) {
      return lastVerse.verseNumber;
    }

    // Find the verse just before the current time
    for (let i = verses.length - 1; i >= 0; i--) {
      const verse = verses[i];
      if (verse && currentTime >= verse.startTime) {
        return verse.verseNumber;
      }
    }

    return _currentVerse || 1;
  }, [verses, currentTime, _currentVerse]);

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

  if (verses.length === 0) {
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
    const verse = verses.find(v => v.verseNumber === verseNumber);
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
        {verses.map(verse => {
          const isCurrentVerse = currentVerse === verse.verseNumber;

          return (
            <TouchableOpacity
              key={verse.verseNumber}
              style={{
                marginBottom: Dimensions.spacing.md,
                padding: Dimensions.spacing.sm,
                backgroundColor: isCurrentVerse
                  ? colors.primary + '20'
                  : 'transparent',
                borderRadius: Dimensions.radius.md,
                borderWidth: isCurrentVerse ? 2 : 0,
                borderColor: isCurrentVerse ? colors.primary : 'transparent',
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
                    color: isCurrentVerse ? colors.primary : colors.text + '80',
                  }}>
                  Verse {verse.verseNumber}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: Fonts.size.base,
                  lineHeight: 24,
                  color: isCurrentVerse ? colors.text : colors.text + '90',
                  fontWeight: isCurrentVerse
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
  title?: string | undefined;
  subtitle?: string | undefined;
  currentVerse?: number | undefined;
  currentTime?: number | undefined;
  onVersePress?: ((verseNumber: number) => void) | undefined;
  onSeek?: ((time: number) => void) | undefined;
}

const ContentSwitcher: React.FC<ContentSwitcherProps> = ({
  mode,
  title,
  subtitle,
  currentVerse,
  currentTime,
  onVersePress,
  onSeek,
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
            title={title}
            subtitle={subtitle}
            currentVerse={currentVerse}
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
  title?: string | undefined;
  subtitle?: string | undefined;
  imagePath?: string | undefined;
  currentVerse?: number | undefined;
  currentTime?: number | undefined;
  onTextPress?: (() => void) | undefined;
  onQueuePress?: (() => void) | undefined;
  onVersionPress?: (() => void) | undefined;
  onVersePress?: ((verseNumber: number) => void) | undefined;
  onSeek?: ((time: number) => void) | undefined;
}

const ExpandedMediaContent: React.FC<ExpandedMediaContentProps> = ({
  title,
  subtitle,
  imagePath,
  currentVerse,
  currentTime,
  onTextPress,
  onQueuePress,
  onVersionPress,
  onVersePress,
  onSeek,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Mode state
  const [currentMode, setCurrentMode] = useState<ContentMode>('text');

  // Convert book name to image path
  const getImagePathFromBookName = (bookName: string): string | undefined => {
    const books = loadBibleBooks();
    const book = books.find(
      b => b.name.toLowerCase() === bookName.toLowerCase()
    );
    return book?.imagePath;
  };

  // Render book image
  const renderBookImage = () => {
    let pathToUse = imagePath;

    // If no imagePath provided, try to get it from the book name (title)
    if (!pathToUse && title) {
      pathToUse = getImagePathFromBookName(title);
    }

    console.log('Debug - title:', title);
    console.log('Debug - imagePath:', imagePath);
    console.log('Debug - pathToUse:', pathToUse);

    if (pathToUse) {
      const imageSource = getBookImageSource(pathToUse);
      console.log('Debug - imageSource:', imageSource);
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
            {title || t('audio.unknownBook', 'Unknown Book')}
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: Fonts.weight.bold,
              color: colors.text,
              marginTop: 2,
            }}>
            {subtitle || t('audio.unknownChapter', 'Unknown Chapter')}
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
          title={title}
          subtitle={subtitle}
          currentVerse={currentVerse}
          currentTime={currentTime}
          onVersePress={onVersePress}
          onSeek={onSeek}
        />
      </View>
    </View>
  );
};

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  title,
  subtitle,
  imagePath,
  isPlaying = false,
  currentTime = 0,
  totalTime = 0,
  currentVerse,
  onPlayPause,
  onPreviousChapter,
  onNextChapter,
  onPreviousVerse,
  onNextVerse,
  onSeek,
  onVersePress,
  testID,
  onTextPress,
  onQueuePress,
  playbackSpeed = 1.0,
  onSpeedChange,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Expansion state management
  const [isExpanded, setIsExpanded] = useState(false);
  const screenHeight = RNDimensions.get('window').height;

  // Version popup state
  const [showVersionPopup, setShowVersionPopup] = useState(false);

  // Speed menu state
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Internal speed state
  const [currentSpeed, setCurrentSpeed] = useState(playbackSpeed);

  // Update internal speed when prop changes
  React.useEffect(() => {
    setCurrentSpeed(playbackSpeed);
  }, [playbackSpeed]);

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

  // Combine title and subtitle into a single display text
  const displayText = () => {
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
          {currentSpeed}x
        </Text>
      </TouchableOpacity>
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
            title={title}
            subtitle={subtitle}
            imagePath={imagePath}
            currentVerse={currentVerse}
            currentTime={currentTime}
            onTextPress={onTextPress}
            onQueuePress={onQueuePress}
            onVersionPress={() => setShowVersionPopup(true)}
            onVersePress={onVersePress}
            onSeek={onSeek}
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
          onSeek={onSeek}
          seekable={!!onSeek && totalTime > 0}
          testID='mini-player-progress'
        />

        {/* Five Circular Control Buttons */}
        <View style={styles.controlsRow}>
          {/* Previous Chapter - « */}
          <TouchableOpacity
            onPress={onPreviousChapter}
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
            onPress={onPreviousVerse}
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
            onPress={onPlayPause}
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
            onPress={onNextVerse}
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
            onPress={onNextChapter}
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
                    currentSpeed === speed
                      ? colors.primary + '20'
                      : 'transparent',
                }}
                onPress={() => {
                  setCurrentSpeed(speed);
                  onSpeedChange?.(speed);
                  setShowSpeedMenu(false);
                }}>
                <Text
                  style={{
                    fontSize: Fonts.size.base,
                    color:
                      currentSpeed === speed ? colors.primary : colors.text,
                    textAlign: 'center',
                    fontWeight:
                      currentSpeed === speed
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
