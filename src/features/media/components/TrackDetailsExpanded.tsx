import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';

interface TrackDetailsProps {
  viewMode: 'text' | 'queue';
  onViewModeChange: (mode: 'text' | 'queue') => void;
  isExpanded: boolean;
}

export const TrackDetails: React.FC<TrackDetailsProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  const { theme } = useTheme();
  const { state } = useMediaPlayer();

  if (!state.currentTrack) return null;

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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
