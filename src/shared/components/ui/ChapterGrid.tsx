import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { ChapterTile } from './ChapterTile';
import { Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';

interface ChapterGridProps {
  chapterCount: number;
  onChapterPress: (chapterNumber: number) => void;
  isVisible: boolean;
  testID?: string;
  onAnimationComplete?: () => void;
  selectedChapter?: number | null;
}

const CHAPTERS_PER_ROW = Dimensions.layout.chaptersPerRow;

export const ChapterGrid: React.FC<ChapterGridProps> = ({
  chapterCount,
  onChapterPress,
  isVisible,
  testID,
  onAnimationComplete,
  selectedChapter,
}) => {
  const { colors } = useTheme();
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);

  // Calculate the number of rows needed
  const numberOfRows = Math.ceil(chapterCount / CHAPTERS_PER_ROW);
  // Tile height (60) + vertical margins (8) + extra padding to prevent cut-off
  const maxHeight = numberOfRows * (60 + 8) + 24; // More generous padding

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingHorizontal: Dimensions.spacing.md,
      marginTop: Dimensions.spacing.xs,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.primary + '20', // Add subtle border with theme color
      borderRadius: Dimensions.radius.lg,
    },
    gridContainer: {
      paddingVertical: Dimensions.spacing.md,
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 0,
      width: '100%',
      maxWidth: 350,
    },
  });

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: maxHeight,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 0,
          duration: 175,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: 175,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShouldRender(false);
        onAnimationComplete?.();
      });
    }
  }, [isVisible, animatedHeight, animatedOpacity, maxHeight]);

  if (!shouldRender && !isVisible) {
    return null;
  }

  // Generate array of chapter numbers
  const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1);

  // Group chapters into rows
  const rows = [];
  for (let i = 0; i < chapters.length; i += CHAPTERS_PER_ROW) {
    rows.push(chapters.slice(i, i + CHAPTERS_PER_ROW));
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: animatedHeight,
          opacity: animatedOpacity,
        },
      ]}
      testID={testID}>
      <View style={styles.gridContainer}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map(chapterNumber => (
              <ChapterTile
                key={chapterNumber}
                chapterNumber={chapterNumber}
                onPress={onChapterPress}
                testID={`chapter-tile-${chapterNumber}`}
                isSelected={selectedChapter === chapterNumber}
              />
            ))}
          </View>
        ))}
      </View>
    </Animated.View>
  );
};
