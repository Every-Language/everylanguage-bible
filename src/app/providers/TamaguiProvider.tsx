import React from 'react';
import { ThemeProvider } from './ThemeProvider';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

// Keep the old name for backward compatibility during migration
export const TamaguiProvider = AppProvider;
