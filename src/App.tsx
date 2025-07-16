import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MainNavigator } from '@/app/navigation/MainNavigator';
import { AppProvider } from '@/app/providers';
import { useTheme } from '@/shared/hooks/useTamaguiTheme';
import '@/shared/services/i18n';
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';
import { SelectMotherTongue } from '@/features/onboarding/screens/SelectMotherTongue';
import { ImportBibleScreen } from '@/features/onboarding/screens/ImportBibleScreen';
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
                component={OnboardingScreen}
              />
              <Stack.Screen
                name='SelectMotherTongue'
                options={{ headerShown: false }}
                component={SelectMotherTongue}
              />
              <Stack.Screen
                name='ImportBible'
                options={{ headerShown: false }}
                component={ImportBibleScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
