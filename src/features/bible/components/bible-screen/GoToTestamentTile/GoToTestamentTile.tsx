import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/shared/store';
import { getBookImageSource } from '@/shared/services';
import { type Book } from '@/shared/utils';
import { createGoToTestamentTileStyles } from './GoToTestamentTile.styles';

export interface GoToTestamentTileProps {
  targetTestament: 'old' | 'new';
  previewBooks: Book[];
  onPress: () => void;
  testID?: string;
}

export const GoToTestamentTile: React.FC<GoToTestamentTileProps> = ({
  targetTestament,
  previewBooks,
  onPress,
  testID,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createGoToTestamentTileStyles(colors, isDark, targetTestament);

  const renderMiniBookImage = (book: Book) => {
    const imageSource = getBookImageSource(book.imagePath);

    if (imageSource) {
      return (
        <Animated.Image
          key={book.id}
          source={imageSource}
          style={styles.miniBookImage}
          resizeMode='contain'
        />
      );
    }

    return (
      <View key={book.id} style={styles.miniFallbackIcon}>
        <Text style={styles.miniFallbackEmoji}>📖</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={`Go to ${targetTestament === 'old' ? 'Old' : 'New'} Testament`}
      testID={testID}>
      <View style={styles.miniIconsContainer}>
        <View style={styles.miniIconsRow}>
          {previewBooks.slice(0, 2).map(book => renderMiniBookImage(book))}
        </View>
        <View style={styles.miniIconsRow}>
          {previewBooks.slice(2, 4).map(book => renderMiniBookImage(book))}
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        Go to {targetTestament === 'old' ? 'Old' : 'New'} Testament
      </Text>
    </TouchableOpacity>
  );
};
