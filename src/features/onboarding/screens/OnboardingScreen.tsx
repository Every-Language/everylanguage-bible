import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/context/ThemeContext';
import { OnboardingContainer } from '../components/OnboardingContainer';
import { useOnboarding } from '../hooks/useOnboarding';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { theme } = useTheme();
  const { loadOnboardingState } = useOnboarding();

  useEffect(() => {
    loadOnboardingState();
  }, [loadOnboardingState]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <OnboardingContainer onComplete={onComplete} />
    </SafeAreaView>
  );
};
