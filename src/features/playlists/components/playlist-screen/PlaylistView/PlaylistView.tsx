import React from 'react';
import { Text } from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { useTheme } from '@/shared/store';
import { usePlayerOverlayHeight } from '@/shared/hooks';
import { PlaylistItem } from '@/features/playlists/services/data/playlistRepository';
import { PlaylistItemComponent } from '../PlaylistItemComponent';
import { createPlaylistViewStyles } from './PlaylistView.styles';

export interface PlaylistViewProps {
  items: PlaylistItem[];
  title: string;
  onItemPress: (item: PlaylistItem) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  items,
  title,
  onItemPress,
}) => {
  const { colors } = useTheme();
  const { collapsedHeight } = usePlayerOverlayHeight();
  const styles = createPlaylistViewStyles(colors, collapsedHeight);

  return (
    <GestureScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps='handled'
      bounces={true}>
      <Text style={styles.title}>{title}</Text>

      {items.map(item => (
        <PlaylistItemComponent
          key={item.id}
          item={item}
          onPress={onItemPress}
          testID={`playlist-item-${item.id}`}
        />
      ))}
    </GestureScrollView>
  );
};
