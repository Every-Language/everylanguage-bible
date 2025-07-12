import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { useTheme } from '@/shared/store';
import { useResponsive } from '@/shared/hooks';
import { useTranslation } from '@/shared/hooks';
import BaseSlide from '../BaseSlide';
import ResponsiveText from '../ResponsiveText';
import genesisImage from '../../../../../assets/images/book_icons/01_genesis.png';

interface AudioSampleProps {
  scrollForward?: () => void;
}

const AudioSample: React.FC<AudioSampleProps> = ({
  scrollForward: _scrollForward,
}) => {
  const { colors } = useTheme();
  const { componentSize, spacing } = useResponsive();
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime] = useState(0);
  const [duration] = useState(30);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = StyleSheet.create({
    icon: {
      width: componentSize.icon,
      height: componentSize.icon,
      marginBottom: spacing.xl,
      backgroundColor: colors.primary,
      borderRadius: componentSize.icon / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    audioCard: {
      width: '100%',
      backgroundColor: colors.background,
      borderRadius: 15,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      borderWidth: 2,
      borderColor: colors.primary,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    audioHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    bookImage: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: spacing.md,
    },
    audioInfo: {
      flex: 1,
    },
    playButton: {
      width: componentSize.button,
      height: componentSize.button,
      borderRadius: componentSize.button / 2,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    progressContainer: {
      width: '100%',
      height: 6,
      backgroundColor: colors.background,
      borderRadius: 3,
      marginBottom: spacing.sm,
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
      width: `${(currentTime / duration) * 100}%`,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    sampleText: {
      lineHeight: 20,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  return (
    <BaseSlide>
      <View style={styles.icon}>
        <ResponsiveText variant='2xl' color={colors.background}>
          🎧
        </ResponsiveText>
      </View>

      <ResponsiveText
        variant='2xl'
        weight='bold'
        align='center'
        style={{ marginBottom: spacing.md }}>
        {t('onboarding.audioSample.title')}
      </ResponsiveText>
      <ResponsiveText
        variant='lg'
        align='center'
        opacity={0.8}
        style={{ marginBottom: spacing.xl }}>
        {t('onboarding.audioSample.subtitle')}
      </ResponsiveText>

      <View style={styles.audioCard}>
        <View style={styles.audioHeader}>
          <Image source={genesisImage} style={styles.bookImage} />
          <View style={styles.audioInfo}>
            <ResponsiveText
              variant='lg'
              weight='semibold'
              style={{ marginBottom: spacing.xs }}>
              {t('onboarding.audioSample.book')}
            </ResponsiveText>
            <ResponsiveText variant='md' opacity={0.7}>
              {t('onboarding.audioSample.chapter')}
            </ResponsiveText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
          activeOpacity={0.8}>
          <ResponsiveText variant='lg' color={colors.background}>
            {isPlaying ? '⏸️' : '▶️'}
          </ResponsiveText>
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar} />
        </View>

        <View style={styles.timeContainer}>
          <ResponsiveText variant='xs' opacity={0.6}>
            {formatTime(currentTime)}
          </ResponsiveText>
          <ResponsiveText variant='xs' opacity={0.6}>
            {formatTime(duration)}
          </ResponsiveText>
        </View>

        <ResponsiveText variant='md' opacity={0.8} style={styles.sampleText}>
          {t('onboarding.audioSample.sampleVerse')}
        </ResponsiveText>
      </View>

      <ResponsiveText variant='md' align='center' opacity={0.6}>
        {t('onboarding.audioSample.tapToPlay')}
      </ResponsiveText>
    </BaseSlide>
  );
};

export default AudioSample;
