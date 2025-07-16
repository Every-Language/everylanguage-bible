import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { BibleStackNavigator } from '../navigation/BibleStackNavigator';

export const BibleContainerScreen: React.FC = () => {
  return (
    <NavigationContainer>
      <BibleStackNavigator />
    </NavigationContainer>
  );
};
