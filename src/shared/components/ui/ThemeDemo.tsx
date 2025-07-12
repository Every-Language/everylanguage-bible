import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '@/shared/store';

export const ThemeDemo: React.FC = () => {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      testID='theme-demo-container'>
      <Text
        style={{
          fontSize: 18,
          fontWeight: 'normal',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 10,
        }}
        testID='theme-demo-title'>
        🙏 Bible App - Theme System Ready!
      </Text>

      <Text
        style={{
          fontSize: 14,
          color: colors.secondary,
          textAlign: 'center',
          marginBottom: 30,
        }}
        testID='theme-demo-subtitle'>
        Zustand-powered theme switching with system sync.
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
          marginBottom: 20,
        }}
        onPress={toggleTheme}
        testID='theme-toggle-button'>
        <Text
          style={{
            color: colors.background,
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
          }}>
          {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </Text>
      </TouchableOpacity>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
        testID='color-container'>
        <Text
          style={{
            fontSize: 12,
            color: colors.secondary,
          }}
          testID='color-label'>
          Primary Color:
        </Text>
        <View
          style={{
            width: 20,
            height: 20,
            backgroundColor: colors.primary,
            borderRadius: 4,
          }}
          testID='color-indicator'
        />
      </View>
    </View>
  );
};
