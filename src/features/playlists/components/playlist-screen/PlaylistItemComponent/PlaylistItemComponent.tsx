import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { useTheme } from '@/shared/store';
import { getBookImageSource } from '@/shared/services';
import { PlaylistItem } from '@/features/playlists/services/data/playlistRepository';
import { createPlaylistItemComponentStyles } from './PlaylistItemComponent.styles';

export interface PlaylistItemComponentProps {
  item: PlaylistItem;
  onPress: (item: PlaylistItem) => void;
  testID?: string;
}

export const PlaylistItemComponent: React.FC<PlaylistItemComponentProps> = ({
  item,
  onPress,
  testID,
}) => {
  const { colors } = useTheme();
  const styles = createPlaylistItemComponentStyles(colors);

  const iconSource = getBookImageSource(item.iconPath);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(item)}
      accessibilityRole='button'
      accessibilityLabel={`${item.title}: ${item.description}`}
      testID={testID}
      activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        {iconSource ? (
          <Image source={iconSource} style={styles.icon} />
        ) : (
          <Text style={styles.fallbackIcon}>📖</Text>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );
};
