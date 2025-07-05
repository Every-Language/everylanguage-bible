import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type Slide = {
  id: number;
  title: string;
  subTitle: string;
  image: string;
  component: 'LanguageDetection' | 'AudioSample' | 'BasicSetup';
};

export type RootStackParamList = {
  Home: undefined;
  Onboarding: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
