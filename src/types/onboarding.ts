import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
  SelectMotherTongue: undefined;
  ImportBible: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
