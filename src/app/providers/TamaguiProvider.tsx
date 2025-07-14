import React from 'react';
import { ThemeProvider } from './ThemeProvider';

interface TamaguiProviderProps {
  children: React.ReactNode;
}

export const TamaguiProvider: React.FC<TamaguiProviderProps> = ({
  children,
}) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};
