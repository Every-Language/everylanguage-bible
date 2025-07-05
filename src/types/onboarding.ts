import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type Slide = {
  id: number;
  component: 'LanguageDetection' | 'AudioSample' | 'BasicSetup';
};

export type RootStackParamList = {
  Home: undefined;
  Onboarding: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
