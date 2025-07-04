import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainNavigator } from '@/app/navigation/MainNavigator';
import { useTheme } from '@/shared/store';
import '@/shared/services/i18n';
import OnBoardingScreen from '@/features/onboarding/screens/OnBoardingScreen';

const AppContent: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <>
      <MainNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
};

type RootStackParamList = {
  Home: undefined; // Home screen takes no parameters
  Onboarding: undefined; // Onboarding screen takes no parameters
};

export default function App() {
  const Stack = createNativeStackNavigator<RootStackParamList>();
  // const Stack = createStackNavigator<RootStackParamList>();

  return (
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
  );
}
