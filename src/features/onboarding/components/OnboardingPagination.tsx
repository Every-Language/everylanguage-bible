import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';

interface OnboardingPaginationProps {
  totalSteps: number;
  currentStep: number;
  onStepPress: (stepIndex: number) => void;
}

export const OnboardingPagination: React.FC<OnboardingPaginationProps> = ({
  totalSteps,
  currentStep,
  onStepPress,
}) => {
  const { theme } = useTheme();

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < totalSteps; i++) {
      const isActive = i === currentStep;
      dots.push(
        <TouchableOpacity
          key={i}
          style={{
            width: isActive ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isActive
              ? theme.colors.primary
              : theme.colors.textSecondary,
            marginHorizontal: 4,
            opacity: isActive ? 1 : 0.5,
          }}
          onPress={() => onStepPress(i)}
          activeOpacity={0.7}
        />
      );
    }
    return dots;
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
      }}>
      {renderDots()}
    </View>
  );
};
