import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useTheme } from '@/shared/hooks';
import { useMediaPlayer } from '@/shared/hooks';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';

interface TrackDetailsProps {
  viewMode: 'text' | 'queue';
  onViewModeChange: (mode: 'text' | 'queue') => void;
  isExpanded: boolean;
}

export const TrackDetails: React.FC<TrackDetailsProps> = ({
  viewMode,
  onViewModeChange,
  isExpanded,
}) => {
  const { theme } = useTheme();
  const { state } = useMediaPlayer();

  if (!state.currentTrack) return null;

  if (!isExpanded) {
    // Collapsed state: inline layout with title/subtitle on left, language on right
    return (
      <View style={styles.collapsedContainer}>
        <View style={styles.collapsedTrackInfo}>
          <Text
            style={[styles.collapsedTitle, { color: theme.colors.text }]}
            numberOfLines={1}>
            {state.currentTrack.title}
          </Text>
          <Text
            style={[
              styles.collapsedSubtitle,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={1}>
            {state.currentTrack.subtitle}
          </Text>
        </View>
        <Text
          style={[
            styles.collapsedLanguage,
            { color: theme.colors.textSecondary },
          ]}>
          ENGLISH - BSB
        </Text>
      </View>
    );
  }

  // Expanded state: full layout with album art and toggles
  return (
    <View style={styles.expandedContainer}>
      <View style={styles.headerContent}>
        <View style={styles.trackInfo}>
          <Text
            style={[styles.trackTitle, { color: theme.colors.text }]}
            numberOfLines={1}>
            {state.currentTrack.title}
          </Text>
          <Text
            style={[
              styles.trackSubtitle,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={1}>
            {state.currentTrack.subtitle}
          </Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Text
            style={[styles.editButtonText, { color: theme.colors.primary }]}>
            Edit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'text' && [
              styles.activeToggle,
              { backgroundColor: theme.colors.primary },
            ],
          ]}
          onPress={() => onViewModeChange('text')}>
          <Text
            style={[
              styles.toggleButtonText,
              {
                color:
                  viewMode === 'text'
                    ? theme.colors.background
                    : theme.colors.text,
              },
            ]}>
            Text
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'queue' && [
              styles.activeToggle,
              { backgroundColor: theme.colors.primary },
            ],
          ]}
          onPress={() => onViewModeChange('queue')}>
          <Text
            style={[
              styles.toggleButtonText,
              {
                color:
                  viewMode === 'queue'
                    ? theme.colors.background
                    : theme.colors.text,
              },
            ]}>
            Queue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Collapsed state styles
  collapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  collapsedTrackInfo: {
    flex: 1,
    marginRight: 12,
  },
  collapsedTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  collapsedSubtitle: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.8,
  },
  collapsedLanguage: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },

  // Expanded state styles
  expandedContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : StatusBar.currentHeight || 0 + 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  trackInfo: {
    flex: 1,
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  trackSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLOR_VARIATIONS.WHITE_10,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  activeToggle: {
    // backgroundColor set dynamically
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
