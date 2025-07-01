import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks';

export const ThemeDemo: React.FC = () => {
  const { isDark, toggleTheme, colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: 'normal',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 14,
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 30,
    },
    themeButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    themeButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    colorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    colorLabel: {
      fontSize: 12,
      color: colors.secondary,
    },
    colorIndicator: {
      width: 20,
      height: 20,
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        🙏 Bible App - Feature-First Architecture Ready!
      </Text>
      <Text style={styles.subtitle}>
        Folder structure created. Ready for development.
      </Text>

      <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
        <Text style={styles.themeButtonText}>
          {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </Text>
      </TouchableOpacity>

      <View style={styles.colorContainer}>
        <Text style={styles.colorLabel}>Primary Color:</Text>
        <View style={styles.colorIndicator} />
      </View>
    </View>
  );
};
