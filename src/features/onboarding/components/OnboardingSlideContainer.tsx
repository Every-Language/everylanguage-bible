import React, { useState } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { OnboardingMainScreen } from '../screens/OnboardingMainScreen';
import { OnlineBibleSetupScreen } from '../screens/OnlineBibleSetupScreen';
import { OfflineBibleSetupScreen } from '../screens/OfflineBibleSetupScreen';

const { width: screenWidth } = Dimensions.get('window');

type OnboardingScreen = 'main' | 'onlineBibleSetup' | 'offlineBibleSetup';

interface OnboardingSlideContainerProps {
  onComplete: () => void;
}

export const OnboardingSlideContainer: React.FC<
  OnboardingSlideContainerProps
> = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>('main');

  const handleNavigateToOnlineBibleSetup = () => {
    setCurrentScreen('onlineBibleSetup');
  };

  const handleNavigateToOfflineBibleSetup = () => {
    setCurrentScreen('offlineBibleSetup');
  };

  const handleBackToMain = () => {
    setCurrentScreen('main');
  };

  const handleComplete = () => {
    onComplete();
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'main':
        return (
          <OnboardingMainScreen
            onNavigateToOnlineBibleSetup={handleNavigateToOnlineBibleSetup}
            onNavigateToOfflineBibleSetup={handleNavigateToOfflineBibleSetup}
            onComplete={handleComplete}
          />
        );
      case 'onlineBibleSetup':
        return (
          <OnlineBibleSetupScreen
            onBack={handleBackToMain}
            onComplete={handleComplete}
          />
        );
      case 'offlineBibleSetup':
        return (
          <OfflineBibleSetupScreen
            onBack={handleBackToMain}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: screenWidth,
  },
});
