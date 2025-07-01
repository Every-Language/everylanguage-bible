import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';

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
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.primary + '30',
      ...Dimensions.shadow.lg,
      zIndex: 1000,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Dimensions.spacing.md,
      paddingHorizontal: Dimensions.spacing.lg,
      minHeight: Dimensions.layout.miniPlayerHeight,
    },
    imageContainer: {
      marginRight: Dimensions.spacing.md,
    },
    image: {
      width: Dimensions.component.miniPlayerImage.width,
      height: Dimensions.component.miniPlayerImage.height,
      borderRadius: Dimensions.radius.md,
    },
    fallbackImage: {
      width: Dimensions.component.miniPlayerImage.width,
      height: Dimensions.component.miniPlayerImage.height,
      borderRadius: Dimensions.radius.md,
      backgroundColor: colors.secondary + '30',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fallbackIcon: {
      fontSize: Fonts.size.xl,
    },
    textContainer: {
      flex: 1,
      marginRight: Dimensions.spacing.md,
    },
    title: {
      fontSize: Fonts.size.base,
      fontWeight: Fonts.weight.semibold,
      color: colors.text,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    controlButton: {
      width: Dimensions.component.controlButton.width,
      height: Dimensions.component.controlButton.height,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Dimensions.radius.full,
      marginHorizontal: Dimensions.spacing.xs,
    },
    playButton: {
      backgroundColor: colors.primary,
      marginHorizontal: Dimensions.spacing.sm,
    },
    controlIcon: {
      fontSize: Fonts.size.base,
      color: colors.text,
    },
    playIcon: {
      fontSize: Fonts.size.base,
      color: colors.background,
    },
  });

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
