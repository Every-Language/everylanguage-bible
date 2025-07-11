import { View, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { useTheme } from '@/shared/store';
import { useResponsive } from '@/shared/hooks';
import { useNavigation } from '@react-navigation/native';
import BaseSlide from '../BaseSlide';
import ResponsiveText from '../ResponsiveText';
import { NavigationProp } from '@/types/onboarding';
import { useTranslation } from '@/shared/hooks';

interface QuickStartProps {
  scrollForward?: () => void;
}

const QuickStart: React.FC<QuickStartProps> = () => {
  const { colors } = useTheme();
  const { componentSize, spacing } = useResponsive();
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();

  const handleStartListening = () => {
    console.log('Start listening now');
    navigation.replace('Home');
  };

  const handleExploreMore = () => {
    console.log('Explore more');
    navigation.replace('Home');
  };

  const styles = StyleSheet.create({
    header: {
      alignItems: 'center',
      marginBottom: spacing['2xl'],
    },
    icon: {
      width: componentSize.icon,
      height: componentSize.icon,
      marginBottom: spacing.xl,
      backgroundColor: colors.primary,
      borderRadius: componentSize.icon / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionsContainer: {
      width: '100%',
      gap: spacing.lg,
    },
    optionCard: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: spacing.lg,
      borderWidth: 2,
      borderColor: colors.primary,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    primaryOption: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    optionIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    primaryOptionIcon: {
      backgroundColor: colors.background,
    },
    secondaryOptionIcon: {
      backgroundColor: colors.primary,
    },
    optionInfo: {
      flex: 1,
    },
    featuresList: {
      marginTop: spacing.md,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    featureIcon: {
      marginRight: spacing.sm,
    },
    recommendation: {
      marginTop: spacing.sm,
      textAlign: 'center',
    },
  });

  return (
    <BaseSlide>
      <View style={styles.header}>
        <View style={styles.icon}>
          <ResponsiveText variant='2xl' color={colors.background}>
            🎉
          </ResponsiveText>
        </View>
        <ResponsiveText
          variant='3xl'
          weight='bold'
          align='center'
          style={{ marginBottom: spacing.sm }}>
          {t('onboarding.quickStart.title')}
        </ResponsiveText>
        <ResponsiveText
          variant='lg'
          align='center'
          opacity={0.8}
          style={{ marginBottom: spacing.md }}>
          {t('onboarding.quickStart.subtitle')}
        </ResponsiveText>
        <ResponsiveText
          variant='lg'
          weight='semibold'
          color={colors.primary}
          align='center'>
          {t('onboarding.quickStart.welcome')}
        </ResponsiveText>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionCard, styles.primaryOption]}
          onPress={handleStartListening}
          activeOpacity={0.9}>
          <View style={styles.optionHeader}>
            <View style={[styles.optionIcon, styles.primaryOptionIcon]}>
              <ResponsiveText variant='lg' color={colors.primary}>
                ▶️
              </ResponsiveText>
            </View>
            <View style={styles.optionInfo}>
              <ResponsiveText
                variant='xl'
                weight='bold'
                color={colors.background}
                style={{ marginBottom: spacing.xs }}>
                {t('onboarding.quickStart.startListening')}
              </ResponsiveText>
              <ResponsiveText
                variant='md'
                color={colors.background}
                opacity={0.9}>
                {t('onboarding.quickStart.startListeningDesc')}
              </ResponsiveText>
            </View>
          </View>

          <View style={styles.featuresList}>
            {[
              t('onboarding.quickStart.features.0'),
              t('onboarding.quickStart.features.1'),
              t('onboarding.quickStart.features.2'),
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <ResponsiveText
                  variant='sm'
                  color={colors.background}
                  opacity={0.9}
                  style={styles.featureIcon}>
                  ✓
                </ResponsiveText>
                <ResponsiveText
                  variant='sm'
                  color={colors.background}
                  opacity={0.9}>
                  {feature}
                </ResponsiveText>
              </View>
            ))}
          </View>

          <ResponsiveText
            variant='xs'
            color={colors.primary}
            weight='semibold'
            style={styles.recommendation}>
            {t('onboarding.quickStart.recommended')}
          </ResponsiveText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleExploreMore}
          activeOpacity={0.8}>
          <View style={styles.optionHeader}>
            <View style={[styles.optionIcon, styles.secondaryOptionIcon]}>
              <ResponsiveText variant='lg' color={colors.background}>
                🔍
              </ResponsiveText>
            </View>
            <View style={styles.optionInfo}>
              <ResponsiveText
                variant='xl'
                weight='bold'
                style={{ marginBottom: spacing.xs }}>
                Explore the Library
              </ResponsiveText>
              <ResponsiveText variant='md' opacity={0.7}>
                Browse all available books and discover new content
              </ResponsiveText>
            </View>
          </View>

          <View style={styles.featuresList}>
            {[
              'Full Bible library access',
              'Search and filter options',
              'Create your own playlists',
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <ResponsiveText
                  variant='sm'
                  opacity={0.7}
                  style={styles.featureIcon}>
                  {['📚', '🔍', '⭐'][index]}
                </ResponsiveText>
                <ResponsiveText variant='sm' opacity={0.7}>
                  {feature}
                </ResponsiveText>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </View>
    </BaseSlide>
  );
};

export default QuickStart;
