import { View, StyleSheet } from 'react-native';
import React from 'react';
import { Slide } from '@/types/onboarding';
import { useResponsive } from '@/shared/hooks';
import SplashScreen from './slides/SplashScreen';
import LanguageDetection from './slides/LanguageDetection';
import AudioSample from './slides/AudioSample';
import BasicSetup from './slides/BasicSetup';
import ContentPreview from './slides/ContentPreview';
import QuickStart from './slides/QuickStart';

// Onboarding Item
// Renders a different functional component for each slide
// To add or remove slides add an object on Slides.tsx and edit components object below

interface OnBoardingItemProps extends Slide {
  scrollForward?: () => void;
}

const OnBoardingItem: React.FC<OnBoardingItemProps> = ({
  component,
  scrollForward,
}) => {
  const { width } = useResponsive();

  const components = {
    SplashScreen: SplashScreen,
    LanguageDetection: LanguageDetection,
    AudioSample: AudioSample,
    BasicSetup: BasicSetup,
    ContentPreview: ContentPreview,
    QuickStart: QuickStart,
  };

  const styles = StyleSheet.create({
    container: {
      width,
    },
  });

  const TargetComponent = components[component];

  return (
    <View style={styles.container}>
      {scrollForward ? (
        <TargetComponent scrollForward={scrollForward} />
      ) : (
        <TargetComponent />
      )}
    </View>
  );
};

export default OnBoardingItem;
