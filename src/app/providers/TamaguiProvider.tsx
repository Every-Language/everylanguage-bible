import React from 'react';
import { TamaguiProvider as TamaguiProviderOrig } from '@tamagui/core';
import { config } from '../../../tamagui.config';

interface TamaguiProviderProps {
  children: React.ReactNode;
}

export const TamaguiProvider: React.FC<TamaguiProviderProps> = ({
  children,
}) => {
  return (
    <TamaguiProviderOrig config={config} defaultTheme='light'>
      {children}
    </TamaguiProviderOrig>
  );
};
