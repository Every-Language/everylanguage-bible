import React from 'react';
import { Image, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/hooks';
import { getBookImageSource } from '@/shared/services';

interface BookCardProps {
  bookName?: string;
  bookId?: string;
  bookImage?: any;
  testament?: 'old' | 'new';
  onPress: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  bookName = 'Book',
  bookId,
  bookImage,
  onPress,
  onLongPress,
  isSelected = false,
}) => {
  const { colors } = useTheme();

  const renderBookImage = () => {
    let imageSource = bookImage;

    // If bookImage is a string path, convert it using imageService
    if (typeof bookImage === 'string') {
      imageSource = getBookImageSource(bookImage);
    }

    if (imageSource) {
      return (
        <Image
          source={imageSource}
          style={[styles.bookImage, { tintColor: colors.textPrimary }]}
          resizeMode='contain'
        />
      );
    }

    return (
      <View
        style={[
          styles.placeholderImage,
          { backgroundColor: colors.secondary + '30' },
        ]}>
        <Text style={[styles.placeholderText, { color: colors.textPrimary }]}>
          📖
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      testID={`book-card-${bookId || bookName.toLowerCase().replace(/\s+/g, '-')}`}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole='button'
      accessibilityLabel={`${bookName} book`}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: isSelected ? colors.primary : colors.secondary,
        },
      ]}>
      <View style={styles.imageContainer}>{renderBookImage()}</View>
      <View style={styles.textContainer}>
        <Text
          style={[styles.bookTitle, { color: colors.textPrimary }]}
          numberOfLines={2}>
          {bookName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 4,
    marginVertical: 4,
    padding: 12,
    borderWidth: 2,
    borderRadius: 8,
    minHeight: 110,
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  bookImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  textContainer: {
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
});
