import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions as RNDimensions,
} from 'react-native';
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

  // Calculate responsive tile size based on screen width
  const screenWidth = RNDimensions.get('window').width;
  const gridPadding = Dimensions.spacing.md * 2; // Left and right padding
  const tileMargins = Dimensions.spacing.xs * 2; // Horizontal margin for each tile
  const totalMargins = tileMargins * CHAPTERS_PER_ROW;
  const availableWidth = screenWidth - gridPadding - totalMargins;
  const calculatedTileSize = Math.floor(availableWidth / CHAPTERS_PER_ROW);

  // Set minimum and maximum tile sizes for better UX
  const minTileSize = 45; // Ensure tiles aren't too small
  const maxTileSize = 70; // Ensure tiles aren't too large on tablets
  const tileSize = Math.max(
    minTileSize,
    Math.min(maxTileSize, calculatedTileSize)
  );

  // Calculate the number of rows needed
  const numberOfRows = Math.ceil(chapterCount / CHAPTERS_PER_ROW);
  // Use calculated tile size + vertical margins (no extra padding needed)
  const maxHeight = numberOfRows * (tileSize + Dimensions.spacing.xs * 2);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingHorizontal: Dimensions.spacing.md,
      marginTop: Dimensions.spacing.xs,
      overflow: 'hidden',
    },
    gridContainer: {
      paddingVertical: 0,
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 0,
      width: '100%',
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
  }, [
    isVisible,
    animatedHeight,
    animatedOpacity,
    maxHeight,
    onAnimationComplete,
  ]);

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
                size={tileSize}
              />
            ))}
          </View>
        ))}
      </View>
    </Animated.View>
  );
};
