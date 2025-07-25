import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/shared/store';
import { getBookImageSource } from '@/shared/services';
import { type Book } from '@/shared/utils';
import { createBookTileStyles } from './BookTile.styles';

export interface BookTileProps {
  book: Book;
  onPress: () => void;
  testID?: string;
}

export const BookTile: React.FC<BookTileProps> = ({
  book,
  onPress,
  testID,
}) => {
  const { colors } = useTheme();
  const styles = createBookTileStyles(colors);

  const renderBookImage = () => {
    const imageSource = getBookImageSource(book.imagePath);

    if (imageSource) {
      return (
        <Animated.Image
          source={imageSource}
          style={styles.bookImage}
          resizeMode='contain'
        />
      );
    }

    return (
      <View style={styles.fallbackIcon}>
        <Text style={styles.fallbackEmoji}>📖</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={`${book.name} book`}
      testID={testID}>
      <View style={styles.imageContainer}>{renderBookImage()}</View>
      <Text style={styles.title} numberOfLines={2}>
        {book.name}
      </Text>
    </TouchableOpacity>
  );
};
