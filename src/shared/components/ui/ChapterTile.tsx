import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/store';

interface ChapterTileProps {
  chapterNumber: number;
  isSelected?: boolean;
  onPress: () => void;
  size?: number;
  testID?: string;
}

export const ChapterTile: React.FC<ChapterTileProps> = ({
  chapterNumber,
  isSelected = false,
  onPress,
  size = 60,
  testID,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      backgroundColor: colors.background,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 4,
      marginVertical: 4,
      borderWidth: 2,
      borderColor: isSelected ? colors.primary : colors.primary + '20',
    },
    chapterNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={`Chapter ${chapterNumber}`}
      testID={testID || `chapter-tile-${chapterNumber}`}>
      <Text style={styles.chapterNumber}>{chapterNumber}</Text>
    </TouchableOpacity>
  );
};
