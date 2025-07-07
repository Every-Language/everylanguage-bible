import { View, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/shared/store';
import { useResponsive, useTranslation } from '@/shared/hooks';
import BaseSlide from '../BaseSlide';
import ResponsiveText from '../ResponsiveText';
import genesisImage from '../../../../../assets/images/books/01_genesis.png';

interface SplashScreenProps {
  scrollForward?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  scrollForward: _scrollForward,
}) => {
  const { colors } = useTheme();
  const { componentSize, spacing } = useResponsive();
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Get device width and calculate progress bar width
  const screenWidth = Dimensions.get('window').width;
  const progressBarWidth = screenWidth - spacing.lg * 2; // Subtract horizontal margins

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }),
    ]).start();

    // Update percentage text
    const listener = progressAnim.addListener(({ value }) => {
      setProgressPercentage(Math.round(value * 100));
    });

    return () => {
      progressAnim.removeListener(listener);
    };
  }, [fadeAnim, progressAnim]);

  const styles = StyleSheet.create({
    logo: {
      width: componentSize.logo,
      height: componentSize.logo,
      marginBottom: spacing.xl,
    },
    progressContainer: {
      width: progressBarWidth,
      height: 14,
      backgroundColor: colors.secondary,
      borderRadius: 5,
      overflow: 'hidden',
      marginTop: spacing.lg,
      marginBottom: spacing.md,
      alignSelf: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 5,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    progressText: {
      position: 'absolute',
      right: 8,
      top: 0,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },

    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <BaseSlide scrollEnabled={false}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image source={genesisImage} style={styles.logo} resizeMode='contain' />
        <ResponsiveText
          variant='3xl'
          weight='bold'
          align='center'
          style={{ marginBottom: spacing.sm }}>
          {t('onboarding.splash.title')}
        </ResponsiveText>
        <ResponsiveText
          variant='lg'
          align='center'
          opacity={0.8}
          style={{ marginBottom: spacing.xl }}>
          {t('onboarding.splash.subtitle')}
        </ResponsiveText>

        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          <View style={styles.progressText}>
            <ResponsiveText
              variant='xs'
              color={colors.background}
              weight='bold'>
              {progressPercentage}%
            </ResponsiveText>
          </View>
        </View>

        <ResponsiveText
          variant='sm'
          align='center'
          opacity={0.6}
          style={{ marginTop: spacing.lg }}>
          {t('onboarding.splash.loading')}
        </ResponsiveText>
      </Animated.View>
    </BaseSlide>
  );
};

export default SplashScreen;
