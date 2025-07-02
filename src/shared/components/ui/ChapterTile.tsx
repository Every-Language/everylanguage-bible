import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';

interface ChapterTileProps {
  chapterNumber: number;
  onPress: (chapterNumber: number) => void;
  testID?: string;
  isSelected?: boolean;
  size?: number; // Optional size prop for responsive sizing
}

export const ChapterTile: React.FC<ChapterTileProps> = ({
  chapterNumber,
  onPress,
  testID,
  isSelected = false,
  size, // Use dynamic size if provided, otherwise fall back to default
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Use provided size or fall back to default
  const tileSize = size || Dimensions.component.chapterTile.width;

  const styles = StyleSheet.create({
    container: {
      width: tileSize,
      height: tileSize,
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

  const handlePress = () => {
    onPress(chapterNumber);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      accessibilityLabel={t('bible.chapter', { number: chapterNumber })}
      accessibilityRole='button'
      testID={testID}>
      <Text style={styles.chapterNumber}>{chapterNumber}</Text>
    </TouchableOpacity>
  );
};
