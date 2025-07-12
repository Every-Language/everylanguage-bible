import React from 'react';
import { Image, View, TouchableOpacity } from 'react-native';
import { Text } from '@tamagui/core';
import { Card } from '@tamagui/card';
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
          style={{
            width: 60,
            height: 60,
            borderRadius: 8,
            tintColor: colors.text,
          }}
          resizeMode='contain'
        />
      );
    }

    return (
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 8,
          backgroundColor: colors.secondary + '30',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text fontSize='$6' color='$color'>
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
      activeOpacity={0.8}>
      <Card
        size='$4'
        marginHorizontal='$1'
        marginVertical='$1'
        padding='$3'
        backgroundColor='$background'
        borderColor={isSelected ? '$primary' : '$secondary'}
        borderWidth={2}
        minHeight={110}
        flex={1}>
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          {renderBookImage()}
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text
            fontSize='$3'
            fontWeight='600'
            color='$color'
            lineHeight={18}
            numberOfLines={2}>
            {bookName}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
