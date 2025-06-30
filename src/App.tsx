import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainNavigator } from '@/app/navigation/MainNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MainNavigator />
        <StatusBar style='auto' />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
