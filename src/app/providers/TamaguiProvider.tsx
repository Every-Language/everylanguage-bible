import React from 'react';
import { TamaguiProvider as BaseTamaguiProvider } from 'tamagui';
import config from '../../../tamagui.config';
import { ThemeProvider } from './ThemeProvider';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <BaseTamaguiProvider config={config}>
      <ThemeProvider>{children}</ThemeProvider>
    </BaseTamaguiProvider>
  );
};

// Keep the old name for backward compatibility during migration
export const TamaguiProvider = AppProvider;
