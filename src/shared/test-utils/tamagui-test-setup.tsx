import React from 'react';
import { TamaguiProvider } from '@tamagui/core';
import { config } from '../../../tamagui.config';

// Test wrapper component that provides Tamagui context
export const TamaguiTestWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <TamaguiProvider config={config}>{children}</TamaguiProvider>;
};
