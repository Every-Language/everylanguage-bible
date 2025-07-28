export type HomeTab = 'Bible' | 'Playlists' | 'Audio Queue';

export interface HomeTabConfig {
  key: HomeTab;
  label: string;
  icon?: string;
}

export interface HomeScreenProps {
  // Add any props needed for the home screen
  [key: string]: unknown;
}

export interface HomeContainerProps {
  // Add any props needed for the home container
  [key: string]: unknown;
}
