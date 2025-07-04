import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
} from 'react-native';
import { useTheme } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';
import { Dimensions, Fonts } from '@/shared/constants';

interface OptionsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onThemeToggle: () => void;
  position: { top: number; right: number };
}

export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  isVisible,
  onClose,
  onThemeToggle,
  position,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.8));

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, scaleAnim]);

  if (!isVisible) return null;

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
    },
    panel: {
      position: 'absolute',
      top: position.top + 8,
      right: position.right,
      backgroundColor: colors.background,
      borderRadius: Dimensions.radius.lg,
      borderWidth: 2,
      borderColor: colors.primary,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      minWidth: 200,
      paddingVertical: Dimensions.spacing.sm,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      minHeight: 48,
    },
    optionIcon: {
      width: 24,
      marginRight: Dimensions.spacing.md,
      fontSize: Fonts.size.lg,
      textAlign: 'center',
    },
    optionText: {
      fontSize: Fonts.size.base,
      color: colors.text,
      flex: 1,
    },
    separator: {
      height: 1,
      backgroundColor: colors.primary + '20',
      marginHorizontal: Dimensions.spacing.md,
    },
  });

  const handleOptionPress = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={onClose}
      testID='options-panel-overlay'>
      <Animated.View
        style={[
          styles.panel,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        {/* Theme Toggle */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleOptionPress(onThemeToggle)}
          accessibilityLabel={
            isDark ? t('theme.switchToLight') : t('theme.switchToDark')
          }
          accessibilityRole='button'
          testID='options-theme-toggle'>
          <Text style={styles.optionIcon}>{isDark ? '☀️' : '🌙'}</Text>
          <Text style={styles.optionText}>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Profile */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() =>
            handleOptionPress(() => console.log('Profile pressed'))
          }
          accessibilityLabel='Profile'
          accessibilityRole='button'
          testID='options-profile'>
          <Text style={styles.optionIcon}>👤</Text>
          <Text style={styles.optionText}>Profile</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Language */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() =>
            handleOptionPress(() => console.log('Language pressed'))
          }
          accessibilityLabel='Language'
          accessibilityRole='button'
          testID='options-language'>
          <Text style={styles.optionIcon}>🌐</Text>
          <Text style={styles.optionText}>Language</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Calculator */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() =>
            handleOptionPress(() => console.log('Calculator pressed'))
          }
          accessibilityLabel='Calculator'
          accessibilityRole='button'
          testID='options-calculator'>
          <Text style={styles.optionIcon}>🧮</Text>
          <Text style={styles.optionText}>Calculator</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Settings */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() =>
            handleOptionPress(() => console.log('Settings pressed'))
          }
          accessibilityLabel='Settings'
          accessibilityRole='button'
          testID='options-settings'>
          <Text style={styles.optionIcon}>⚙️</Text>
          <Text style={styles.optionText}>Settings</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Help */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleOptionPress(() => console.log('Help pressed'))}
          accessibilityLabel='Help'
          accessibilityRole='button'
          testID='options-help'>
          <Text style={styles.optionIcon}>❓</Text>
          <Text style={styles.optionText}>Help</Text>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};
