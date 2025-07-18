import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthForm } from '../components/AuthForm';

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <View style={styles.container}>
      <AuthForm mode={mode} onModeChange={setMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
