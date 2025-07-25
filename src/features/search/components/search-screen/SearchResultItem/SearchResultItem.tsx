import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@/shared/store';
import type { AudioRecording } from '@/types';
import { searchService } from '@/features/search/services/domain/searchService';
import { createSearchResultItemStyles } from './SearchResultItem.styles';

export interface SearchResultItemProps {
  recording: AudioRecording;
  onPress: (recording: AudioRecording) => void;
  testID?: string;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  recording,
  onPress,
  testID,
}) => {
  const { colors } = useTheme();
  const styles = createSearchResultItemStyles(colors);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(recording)}
      accessibilityRole='button'
      accessibilityLabel={`${recording.title} audio recording`}
      testID={testID}>
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {recording.title}
        </Text>
        {recording.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recording.description}
          </Text>
        )}
        <Text style={styles.duration}>
          {searchService.formatDuration(recording.duration_seconds ?? 0)}
        </Text>
      </View>
      <View style={styles.audioIcon}>
        <Text style={styles.audioIconText}>🎵</Text>
      </View>
    </TouchableOpacity>
  );
};
