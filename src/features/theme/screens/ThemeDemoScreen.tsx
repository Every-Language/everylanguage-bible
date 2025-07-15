import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeDemo } from '@/shared/components/ui/ThemeDemo';
import { useTheme } from '@/shared/hooks/useTamaguiTheme';
import { Fonts, Dimensions } from '@/shared/constants';

interface ThemeDemoScreenProps {
  onBack: () => void;
}

export const ThemeDemoScreen: React.FC<ThemeDemoScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: insets.top + Dimensions.spacing.md,
      paddingHorizontal: Dimensions.spacing.xl,
      paddingBottom: Dimensions.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    backButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: Dimensions.spacing.md,
      paddingVertical: Dimensions.spacing.sm,
      borderRadius: Dimensions.radius.lg,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Dimensions.spacing.md,
    },
    title: {
      fontSize: Fonts.size['2xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.textPrimary,
      flex: 1,
    },
    content: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityLabel='Go back to Bible books'
          accessibilityRole='button'
          testID='theme-demo-back-button'>
          <BackIcon size={20} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Theme Demo</Text>
      </View>

      <View style={styles.content}>
        <ThemeDemo />
      </View>
    </View>
  );
};

// Simple back arrow icon component
const BackIcon: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
    <View
      style={{
        width: size * 0.6,
        height: size * 0.6,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
      }}
    />
  </View>
);
