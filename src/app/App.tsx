import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ThemeProvider } from '../shared/hooks';
import { ThemeDemo } from '../shared/components/ui';

export default function App() {
  return (
    <ThemeProvider>
      <ThemeDemo />
      <StatusBar style='auto' />
    </ThemeProvider>
  );
}
