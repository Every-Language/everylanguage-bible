import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { ChapterTile } from './ChapterTile';

interface ChapterGridProps {
  chapterCount: number;
  onChapterPress: (chapterNumber: number) => void;
  isVisible: boolean;
  testID?: string;
}

const CHAPTERS_PER_ROW = 5;

export const ChapterGrid: React.FC<ChapterGridProps> = ({
  chapterCount,
  onChapterPress,
  isVisible,
  testID,
}) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);

  // Calculate the number of rows needed
  const numberOfRows = Math.ceil(chapterCount / CHAPTERS_PER_ROW);
  // Tile height (60) + vertical margins (8) + extra padding to prevent cut-off
  const maxHeight = numberOfRows * (60 + 8) + 24; // More generous padding

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
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShouldRender(false);
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
              />
            ))}
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12, // Match book container padding
    marginTop: 4,
    overflow: 'hidden',
  },
  gridContainer: {
    paddingVertical: 12,
    alignItems: 'center', // Center the grid
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center', // Center each row
    marginBottom: 0, // Remove extra margin, let ChapterTile margins handle spacing
    width: '100%',
    maxWidth: 350, // Constrain width for better centering on larger screens
  },
});
