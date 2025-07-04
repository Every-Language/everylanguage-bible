import { View, Text, useWindowDimensions, StyleSheet } from 'react-native';
import React from 'react';
import { Slide } from '@/types/onboarding';

const OnBoardingItem: React.FC<Slide> = ({ id, title, subTitle, image }) => {
  const { width: PAGE_WIDTH } = useWindowDimensions();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: PAGE_WIDTH,
    },
  });

  return (
    <View style={[styles.container]}>
      <Text>{id}</Text>
      <Text>{image}</Text>
      <Text>{title}</Text>
      <Text>{subTitle}</Text>
    </View>
  );
};

export default OnBoardingItem;
