import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { useTheme } from '@/shared/store';
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

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 12,
      marginHorizontal: 4,
      marginVertical: 4,
      minHeight: 110,
      flex: 1,
      borderWidth: 2,
      borderColor: isSelected ? colors.primary : colors.primary + '20',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    imageContainer: {
      alignItems: 'center',
      marginBottom: 12,
    },
    bookImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      tintColor: colors.text,
    },
    fallbackIcon: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: colors.secondary + '30',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fallbackEmoji: {
      fontSize: 24,
      color: colors.text,
    },
    textContainer: {
      alignItems: 'center',
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.text,
      lineHeight: 18,
    },
  });

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
      onLongPress={onLongPress}
      accessibilityRole='button'
      accessibilityLabel={`${bookName} book`}
      testID={`book-card-${bookId || bookName.toLowerCase().replace(/\s+/g, '-')}`}>
      <View style={styles.imageContainer}>{renderBookImage()}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {bookName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
