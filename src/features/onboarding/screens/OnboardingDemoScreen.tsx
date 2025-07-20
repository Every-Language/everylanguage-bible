import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/context/ThemeContext';
import { OnboardingScreen } from './OnboardingScreen';
import { useOnboarding } from '../hooks/useOnboarding';

export const OnboardingDemoScreen: React.FC = () => {
  const { theme } = useTheme();
  const { resetOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  const handleComplete = () => {
    setShowOnboarding(false);
  };

  const handleReset = () => {
    resetOnboarding();
    setShowOnboarding(true);
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleComplete} />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Onboarding Demo
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Start Onboarding</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#AF915A',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
