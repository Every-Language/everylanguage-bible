import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

interface MiniPlayerProps {
  title?: string;
  subtitle?: string;
  imagePath?: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onExpand: () => void;
  testID?: string;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  title = 'No audio selected',
  subtitle,
  imagePath,
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  onExpand,
  testID,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onExpand}
      testID={testID}
      accessibilityLabel='Audio player controls'
      activeOpacity={0.9}>
      <View style={styles.content}>
        {/* Album Art / Book Image */}
        <View style={styles.imageContainer}>
          {imagePath ? (
            <Image source={{ uri: imagePath }} style={styles.image} />
          ) : (
            <View style={styles.fallbackImage}>
              <Text style={styles.fallbackIcon}>🎵</Text>
            </View>
          )}
        </View>

        {/* Title and Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Control Buttons */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={onPrevious}
            style={styles.controlButton}
            testID='mini-player-previous'
            accessibilityLabel='Previous verse'>
            <Text style={styles.controlIcon}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPlayPause}
            style={[styles.controlButton, styles.playButton]}
            testID='mini-player-play-pause'
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNext}
            style={styles.controlButton}
            testID='mini-player-next'
            accessibilityLabel='Next verse'>
            <Text style={styles.controlIcon}>⏭</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    minHeight: 70,
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  fallbackImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  playButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 8,
  },
  controlIcon: {
    fontSize: 16,
    color: '#333333',
  },
  playIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
});
