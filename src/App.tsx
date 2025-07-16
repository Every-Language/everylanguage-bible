import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MainNavigator } from '@/app/navigation/MainNavigator';
import { AppProvider } from '@/app/providers';
import { useTheme, useCalculatorMode } from '@/shared/store';
import '@/shared/services/i18n';
import { NewOnboardingScreen } from '@/features/onboarding/screens/NewOnboardingScreen';
import { OnboardingFlow1Screen } from '@/features/onboarding/screens/OnboardingFlow1Screen';
import { OnboardingFlow2Screen } from '@/features/onboarding/screens/OnboardingFlow2Screen';
import { CalculatorScreen } from '@/features/calculator/screens/CalculatorScreen';
import { RootStackParamList } from './types/onboarding';

const AppContent: React.FC = () => {
  const { isDark } = useTheme();
  const { isCalculatorMode } = useCalculatorMode();

  // If calculator mode is active, show only the calculator screen
  if (isCalculatorMode) {
    return (
      <>
        <CalculatorScreen />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName='Onboarding'>
              <Stack.Screen
                name='Home'
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                }}
                component={AppContent}
              />
              <Stack.Screen
                name='Onboarding'
                options={{ headerShown: false }}
                component={NewOnboardingScreen}
              />
              <Stack.Screen
                name='OnboardingFlow1'
                options={{ headerShown: false }}
                component={OnboardingFlow1Screen}
              />
              <Stack.Screen
                name='OnboardingFlow2'
                options={{ headerShown: false }}
                component={OnboardingFlow2Screen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
