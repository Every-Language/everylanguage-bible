import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainNavigator } from '@/app/navigation/MainNavigator';
import { TamaguiProvider } from '@/app/providers';
import { useTheme } from '@/shared/store';
import '@/shared/services/i18n';

const AppContent: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <>
      <MainNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
};

export default function App() {
  return (
    <TamaguiProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </SafeAreaProvider>
    </TamaguiProvider>
  );
}
