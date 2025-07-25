import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { useTheme } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';
import { VerseDisplayData } from '@/types/audio';
import { createTrackTextViewStyles } from './TrackTextView.styles';

export interface TrackTextViewProps {
  verseDisplayData: VerseDisplayData[];
  currentTime: number;
  onVersePress?: ((verseNumber: number) => void) | undefined;
  onSeek?: ((time: number) => void) | undefined;
}

export const TrackTextView: React.FC<TrackTextViewProps> = ({
  verseDisplayData,
  currentTime: _currentTime,
  onVersePress,
  onSeek,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = createTrackTextViewStyles(colors, isDark);

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

  if (verseDisplayData.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateTitle}>
          {t('audio.textMode', 'Text Mode')}
        </Text>
        <Text style={styles.emptyStateSubtitle}>
          {t('audio.noVerseText', 'No verse text available')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GestureScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps='handled'
        nestedScrollEnabled={false}
        scrollEventThrottle={16}
        bounces={true}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}>
        {verseDisplayData.map(verse => {
          const isCurrentVerse = verse.isCurrentVerse;
          return (
            <TouchableOpacity
              key={verse.verseNumber}
              style={[
                styles.verseContainer,
                isCurrentVerse && styles.currentVerseContainer,
              ]}
              onPress={() => handleVersePress(verse.verseNumber)}
              activeOpacity={0.7}
              onLayout={event => {
                const { y } = event.nativeEvent.layout;
                handleVerseLayout(verse.verseNumber, y);
              }}>
              <View style={styles.verseNumberContainer}>
                <Text
                  style={[
                    styles.verseNumber,
                    isCurrentVerse
                      ? styles.currentVerseNumber
                      : styles.inactiveVerseNumber,
                  ]}>
                  Verse {verse.verseNumber}
                </Text>
              </View>
              <Text
                style={[
                  styles.verseText,
                  isCurrentVerse
                    ? styles.currentVerseText
                    : styles.inactiveVerseText,
                ]}>
                {verse.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </GestureScrollView>
    </View>
  );
};
