import React from 'react';
import {
  View,
  Text,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { Button } from '@/shared/components/ui/Button';
import { OnboardingStepProps } from '../types';

const { width: screenWidth } = Dimensions.get('window');

// Sub-component for the icon section
const IconSection: React.FC<{ theme: any; icon: string }> = ({
  theme,
  icon,
}) => (
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
    <Text style={{ fontSize: 48 }}>{icon}</Text>
  </View>
);

// Sub-component for the content section
const ContentSection: React.FC<{
  theme: any;
  title: string;
  subtitle: string;
  description: string;
}> = ({ theme, title, subtitle, description }) => (
  <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
    <Text
      style={{
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
        lineHeight: theme.typography.lineHeight.xxl,
      }}>
      {title}
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
      {subtitle}
    </Text>
    <Text
      style={{
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: theme.typography.lineHeight.md,
        paddingHorizontal: theme.spacing.md,
      }}>
      {description}
    </Text>
  </View>
);

// Sub-component for the actions section
const ActionsSection: React.FC<{
  isLastStep: boolean;
  onNext: () => void;
  onSkip: () => void;
  theme: any;
}> = ({ isLastStep, onNext, onSkip, theme }) => (
  <View style={{ width: '100%', alignItems: 'center' }}>
    <Button
      title={isLastStep ? 'Get Started' : 'Next'}
      onPress={onNext}
      variant='primary'
      fullWidth
    />

    {!isLastStep && (
      <TouchableOpacity
        style={{
          marginTop: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        }}
        onPress={onSkip}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.textSecondary,
            fontWeight: '500',
          }}>
          Skip
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

export const OnboardingStep: React.FC<OnboardingStepProps> = ({
  step,
  isActive,
  onNext,
  onSkip,
  isLastStep,
}) => {
  const { theme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
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
      <IconSection theme={theme} icon={step.icon} />

      <ContentSection
        theme={theme}
        title={step.title}
        subtitle={step.subtitle}
        description={step.description}
      />

      <ActionsSection
        isLastStep={isLastStep}
        onNext={onNext}
        onSkip={onSkip}
        theme={theme}
      />
    </Animated.View>
  );
};
