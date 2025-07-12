import React from 'react';
import { TamaguiProvider } from '@tamagui/core';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { config } from '../../../tamagui.config';

// Test wrapper component that provides Tamagui context
export const TamaguiTestWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 44, left: 0, right: 0, bottom: 34 },
      }}>
      <TamaguiProvider config={config}>{children}</TamaguiProvider>
    </SafeAreaProvider>
  );
};
