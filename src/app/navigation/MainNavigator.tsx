import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeDemoScreen } from '@/features/theme';
import { useTheme } from '@/shared/hooks/useTamaguiTheme';

export const MainNavigator: React.FC = () => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  return (
    <View style={styles.container}>
      <ThemeDemoScreen onBack={() => {}} />
    </View>
  );
};
