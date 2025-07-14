import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

// Test wrapper component that provides theme context
export const ThemeTestWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 44, left: 0, right: 0, bottom: 34 },
      }}>
      <ThemeProvider>{children}</ThemeProvider>
    </SafeAreaProvider>
  );
};

// Keep the old name for backward compatibility during migration
export const TamaguiTestWrapper = ThemeTestWrapper;
