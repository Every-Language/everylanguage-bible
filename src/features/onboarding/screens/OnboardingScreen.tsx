import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/context/ThemeContext';
import { OnboardingSlideContainer } from '../components/OnboardingSlideContainer';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}>
      <OnboardingSlideContainer onComplete={onComplete} />
    </SafeAreaView>
  );
};
