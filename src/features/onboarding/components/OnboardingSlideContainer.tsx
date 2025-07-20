import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import { OnboardingMainScreen } from '../screens/OnboardingMainScreen';
import { MotherTongueSearchScreen } from '../screens/MotherTongueSearchScreen';
import { ImportBibleScreen } from '../screens/ImportBibleScreen';

const { width: screenWidth } = Dimensions.get('window');

type OnboardingScreen = 'main' | 'motherTongue' | 'importBible';

interface OnboardingSlideContainerProps {
  onComplete: () => void;
}

export const OnboardingSlideContainer: React.FC<
  OnboardingSlideContainerProps
> = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>('main');

  const handleNavigateToMotherTongue = () => {
    setCurrentScreen('motherTongue');
  };

  const handleNavigateToImportBible = () => {
    setCurrentScreen('importBible');
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
            onNavigateToMotherTongue={handleNavigateToMotherTongue}
            onNavigateToImportBible={handleNavigateToImportBible}
            onComplete={handleComplete}
          />
        );
      case 'motherTongue':
        return (
          <MotherTongueSearchScreen
            onBack={handleBackToMain}
            onComplete={handleBackToMain}
          />
        );
      case 'importBible':
        return (
          <ImportBibleScreen
            onBack={handleBackToMain}
            onComplete={handleBackToMain}
          />
        );
      default:
        return null;
    }
  };

  return <View style={{ flex: 1, width: screenWidth }}>{renderScreen()}</View>;
};
