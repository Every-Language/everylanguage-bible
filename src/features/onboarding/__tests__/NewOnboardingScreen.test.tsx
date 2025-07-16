import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NewOnboardingScreen } from '../screens/NewOnboardingScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from '@/app/providers';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

const Stack = createNativeStackNavigator();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name='Test' component={() => <>{children}</>} />
      </Stack.Navigator>
    </NavigationContainer>
  </AppProvider>
);

describe('NewOnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <NewOnboardingScreen />
      </TestWrapper>
    );

    expect(getByText('Welcome to Bible App')).toBeTruthy();
    expect(getByText('Quick Start')).toBeTruthy();
    expect(getByText('Custom Setup')).toBeTruthy();
  });

  it('navigates to OnboardingFlow1 when Quick Start card is pressed', () => {
    const { getByText } = render(
      <TestWrapper>
        <NewOnboardingScreen />
      </TestWrapper>
    );

    const quickStartCard = getByText('Quick Start');
    fireEvent.press(quickStartCard);

    expect(mockNavigate).toHaveBeenCalledWith('OnboardingFlow1');
  });

  it('navigates to OnboardingFlow2 when Custom Setup card is pressed', () => {
    const { getByText } = render(
      <TestWrapper>
        <NewOnboardingScreen />
      </TestWrapper>
    );

    const customSetupCard = getByText('Custom Setup');
    fireEvent.press(customSetupCard);

    expect(mockNavigate).toHaveBeenCalledWith('OnboardingFlow2');
  });
});
