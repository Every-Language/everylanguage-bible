import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';

interface ChapterTileProps {
  chapterNumber: number;
  onPress: (chapterNumber: number) => void;
  testID?: string;
  isSelected?: boolean;
}

export const ChapterTile: React.FC<ChapterTileProps> = ({
  chapterNumber,
  onPress,
  testID,
  isSelected = false,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width: Dimensions.component.chapterTile.width,
      height: Dimensions.component.chapterTile.height,
      backgroundColor: colors.background,
      borderRadius: Dimensions.radius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: Dimensions.spacing.xs,
      marginVertical: Dimensions.spacing.xs,
      borderWidth: 1,
      borderColor: isSelected ? colors.primary : colors.primary + '20', // Highlight border when selected
    },
    chapterNumber: {
      fontSize: Fonts.size.base,
      fontWeight: Fonts.weight.semibold,
      color: colors.text,
    },
  });

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
