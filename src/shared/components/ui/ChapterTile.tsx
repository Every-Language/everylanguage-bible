import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Dimensions } from '@/shared/constants';

interface ChapterTileProps {
  chapterNumber: number;
  onPress: (chapterNumber: number) => void;
  testID?: string;
}

export const ChapterTile: React.FC<ChapterTileProps> = ({
  chapterNumber,
  onPress,
  testID,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(chapterNumber)}
      accessibilityLabel={`Chapter ${chapterNumber}`}
      accessibilityRole='button'
      testID={testID}>
      <Text style={styles.chapterNumber}>{chapterNumber}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: Dimensions.component.chapterTile.width,
    height: Dimensions.component.chapterTile.height,
    backgroundColor: Colors.chapter.background,
    borderRadius: Dimensions.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Dimensions.spacing.xs,
    marginVertical: Dimensions.spacing.xs,
    borderWidth: 1,
    borderColor: Colors.chapter.border,
  },
  chapterNumber: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.chapter.text,
  },
});
