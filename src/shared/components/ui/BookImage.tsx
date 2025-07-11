import React from 'react';
import { View, Text, Image } from 'react-native';
import { getBookImageSource } from '@/shared/services';
import { Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';

interface BookImageProps {
  imagePath?: string;
  size?: number;
  fallbackEmoji?: string;
  style?: Record<string, unknown>;
  testID?: string;
}

export const BookImage: React.FC<BookImageProps> = ({
  imagePath,
  size = 60,
  fallbackEmoji = '📖',
  style,
  testID,
}) => {
  const { colors } = useTheme();

  if (imagePath) {
    const imageSource = getBookImageSource(imagePath);
    if (imageSource) {
      return (
        <Image
          source={imageSource}
          style={[
            {
              width: size,
              height: size,
              borderRadius: Dimensions.radius.md,
            },
            style,
          ]}
          resizeMode='contain'
          testID={testID}
        />
      );
    }
  }

  // Fallback to emoji
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: Dimensions.radius.md,
          backgroundColor: colors.secondary + '30',
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
      testID={testID}>
      <Text style={{ fontSize: size * 0.5, color: colors.text }}>
        {fallbackEmoji}
      </Text>
    </View>
  );
};
