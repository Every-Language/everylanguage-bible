import { View, useWindowDimensions, StyleSheet } from 'react-native';
import React from 'react';
import { Slide } from '@/types/onboarding';
import LanguageDetection from './slides/LanguageDetection';
import AudioSample from './slides/AudioSample';
import BasicSetup from './slides/BasicSetup';

// Onboarding Item
// Renders a different functional component for each slide
// To add or remove slides add an object on Slides.tsx and edit components object below

const OnBoardingItem: React.FC<Slide> = ({ component }) => {
  const components = {
    LanguageDetection: LanguageDetection,
    AudioSample: AudioSample,
    BasicSetup: BasicSetup,
  };

  const { width: PAGE_WIDTH } = useWindowDimensions();
  const styles = StyleSheet.create({
    container: {
      width: PAGE_WIDTH,
    },
  });

  const TargetComponent = components[component];

  return (
    <View style={[styles.container]}>
      <TargetComponent />
    </View>
  );
};

export default OnBoardingItem;
