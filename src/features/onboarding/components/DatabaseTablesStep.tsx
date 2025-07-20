import React, { useEffect } from 'react';
import { View, Text, Dimensions, Animated } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { Button } from '@/shared/components/ui/Button';
import { OnboardingStepProps } from '../types';

const { width: screenWidth } = Dimensions.get('window');

export const DatabaseTablesStep: React.FC<OnboardingStepProps> = ({
  step,
  isActive,
  onNext,
  onSkip,
  isLastStep,
}) => {
  const { theme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [isActive, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={{
        flex: 1,
        width: screenWidth,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
      {/* Icon Section */}
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: theme.colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
        <Text style={{ fontSize: 48 }}>{step.icon}</Text>
      </View>

      {/* Content Section */}
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.xxl,
            fontWeight: 'bold',
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: theme.spacing.sm,
            lineHeight: theme.typography.lineHeight.xxl,
          }}>
          {step.title}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.accent,
            textAlign: 'center',
            marginBottom: theme.spacing.md,
            fontWeight: '600',
            lineHeight: theme.typography.lineHeight.lg,
          }}>
          {step.subtitle}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: theme.typography.lineHeight.md,
            paddingHorizontal: theme.spacing.md,
          }}>
          {step.description}
        </Text>
      </View>

      {/* Database Info Section */}
      <View style={{ width: '100%', marginBottom: theme.spacing.xl }}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.md,
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: theme.spacing.sm,
              textAlign: 'center',
            }}>
            Database Tables Created
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              lineHeight: theme.typography.lineHeight.sm,
            }}>
            • Bible books and chapters{'\n'}• Verses and translations{'\n'}•
            User preferences and bookmarks{'\n'}• Audio tracks and playlists
          </Text>
        </View>
      </View>

      {/* Actions Section */}
      <View style={{ width: '100%', alignItems: 'center' }}>
        <Button
          title={isLastStep ? 'Get Started' : 'Next'}
          onPress={onNext}
          variant='primary'
          fullWidth
        />

        {!isLastStep && (
          <Button
            title='Skip'
            onPress={onSkip}
            variant='secondary'
            fullWidth
            style={{ marginTop: theme.spacing.sm }}
          />
        )}
      </View>
    </Animated.View>
  );
};
