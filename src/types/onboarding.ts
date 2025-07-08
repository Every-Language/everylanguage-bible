import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type Slide = {
  id: number;
  component:
    | 'SplashScreen'
    | 'LanguageDetection'
    | 'AudioSample'
    | 'BasicSetup'
    | 'ContentPreview'
    | 'QuickStart';
};

export type UserPreferences = {
  language: string;
  audioEnabled: boolean;
  autoPlay: boolean;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
};

export type RootStackParamList = {
  Home: undefined;
  Onboarding: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
