import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainNavigator } from '@/app/navigation/MainNavigator';
import { TamaguiProvider } from '@/app/providers';
import { useTheme } from '@/shared/store';
import '@/shared/services/i18n';
import OnBoardingScreen from '@/features/onboarding/screens/OnBoardingScreen';
import { RootStackParamList } from './types/onboarding';

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
  const Stack = createNativeStackNavigator<RootStackParamList>();

  return (
    <TamaguiProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName='Onboarding'>
            <Stack.Screen
              name='Home'
              options={{ headerShown: false }}
              component={AppContent}
            />
            <Stack.Screen
              name='Onboarding'
              options={{ headerShown: false }}
              component={OnBoardingScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </TamaguiProvider>
  );
}
