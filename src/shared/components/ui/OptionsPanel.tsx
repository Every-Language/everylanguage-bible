import React from 'react';
import { TouchableOpacity, Animated, View, Text } from 'react-native';
import { useTheme } from '@/shared/hooks';
import { useHelpPanelStore } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';
import { Dimensions, Fonts } from '@/shared/constants';

interface OptionsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  position: { top: number; right: number };
}

export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  isVisible,
  onClose,
  position,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { openHelpPanel } = useHelpPanelStore();
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

  const handleOptionPress = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <TouchableOpacity
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
      }}
      activeOpacity={1}
      onPress={onClose}
      testID='options-panel-overlay'>
      <Animated.View
        style={{
          position: 'absolute',
          top: position.top + 8,
          right: position.right,
          backgroundColor: colors.background,
          borderRadius: Dimensions.radius.lg,
          borderWidth: 2,
          borderColor: colors.primary,
          shadowColor: colors.textPrimary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
          minWidth: 200,
          paddingVertical: Dimensions.spacing.sm,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}>
        {/* Theme Toggle */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Dimensions.spacing.lg,
            paddingVertical: Dimensions.spacing.md,
            minHeight: 48,
          }}
          onPress={() => handleOptionPress(toggleTheme)}
          accessibilityLabel={
            isDark ? t('theme.switchToLight') : t('theme.switchToDark')
          }
          accessibilityRole='button'
          testID='options-theme-toggle'>
          <Text
            style={{
              width: 24,
              marginRight: Dimensions.spacing.md,
              fontSize: Fonts.size.lg,
              textAlign: 'center',
            }}>
            {isDark ? '☀️' : '🌙'}
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.textPrimary,
              flex: 1,
            }}>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Text>
        </TouchableOpacity>

        <View
          style={{
            height: 1,
            backgroundColor: colors.primary + '20',
            marginHorizontal: Dimensions.spacing.md,
          }}
        />

        {/* Search */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Dimensions.spacing.lg,
            paddingVertical: Dimensions.spacing.md,
            minHeight: 48,
          }}
          onPress={() => console.log('Search pressed')}
          accessibilityLabel='Search'
          accessibilityRole='button'
          testID='options-search'>
          <Text
            style={{
              width: 24,
              marginRight: Dimensions.spacing.md,
              fontSize: Fonts.size.lg,
              textAlign: 'center',
            }}>
            🔍
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.textPrimary,
              flex: 1,
            }}>
            Search
          </Text>
        </TouchableOpacity>

        <View
          style={{
            height: 1,
            backgroundColor: colors.primary + '20',
            marginHorizontal: Dimensions.spacing.md,
          }}
        />

        {/* Profile */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Dimensions.spacing.lg,
            paddingVertical: Dimensions.spacing.md,
            minHeight: 48,
          }}
          onPress={() =>
            handleOptionPress(() => console.log('Profile pressed'))
          }
          accessibilityLabel='Profile'
          accessibilityRole='button'
          testID='options-profile'>
          <Text
            style={{
              width: 24,
              marginRight: Dimensions.spacing.md,
              fontSize: Fonts.size.lg,
              textAlign: 'center',
            }}>
            👤
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.textPrimary,
              flex: 1,
            }}>
            Profile
          </Text>
        </TouchableOpacity>

        <View
          style={{
            height: 1,
            backgroundColor: colors.primary + '20',
            marginHorizontal: Dimensions.spacing.md,
          }}
        />

        {/* Language */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Dimensions.spacing.lg,
            paddingVertical: Dimensions.spacing.md,
            minHeight: 48,
          }}
          onPress={() =>
            handleOptionPress(() => console.log('Language pressed'))
          }
          accessibilityLabel='Language'
          accessibilityRole='button'
          testID='options-language'>
          <Text
            style={{
              width: 24,
              marginRight: Dimensions.spacing.md,
              fontSize: Fonts.size.lg,
              textAlign: 'center',
            }}>
            🌐
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.textPrimary,
              flex: 1,
            }}>
            Language
          </Text>
        </TouchableOpacity>

        <View
          style={{
            height: 1,
            backgroundColor: colors.primary + '20',
            marginHorizontal: Dimensions.spacing.md,
          }}
        />

        {/* Calculator */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Dimensions.spacing.lg,
            paddingVertical: Dimensions.spacing.md,
            minHeight: 48,
          }}
          onPress={() =>
            handleOptionPress(() => console.log('Calculator pressed'))
          }
          accessibilityLabel='Calculator'
          accessibilityRole='button'
          testID='options-calculator'>
          <Text
            style={{
              width: 24,
              marginRight: Dimensions.spacing.md,
              fontSize: Fonts.size.lg,
              textAlign: 'center',
            }}>
            🧮
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.textPrimary,
              flex: 1,
            }}>
            Calculator
          </Text>
        </TouchableOpacity>

        <View
          style={{
            height: 1,
            backgroundColor: colors.primary + '20',
            marginHorizontal: Dimensions.spacing.md,
          }}
        />

        {/* Settings */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Dimensions.spacing.lg,
            paddingVertical: Dimensions.spacing.md,
            minHeight: 48,
          }}
          onPress={() =>
            handleOptionPress(() => console.log('Settings pressed'))
          }
          accessibilityLabel='Settings'
          accessibilityRole='button'
          testID='options-settings'>
          <Text
            style={{
              width: 24,
              marginRight: Dimensions.spacing.md,
              fontSize: Fonts.size.lg,
              textAlign: 'center',
            }}>
            ⚙️
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.textPrimary,
              flex: 1,
            }}>
            Settings
          </Text>
        </TouchableOpacity>

        <View
          style={{
            height: 1,
            backgroundColor: colors.primary + '20',
            marginHorizontal: Dimensions.spacing.md,
          }}
        />

        {/* Help */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Dimensions.spacing.lg,
            paddingVertical: Dimensions.spacing.md,
            minHeight: 48,
          }}
          onPress={() => handleOptionPress(() => openHelpPanel())}
          accessibilityLabel='Help'
          accessibilityRole='button'
          testID='options-help'>
          <Text
            style={{
              width: 24,
              marginRight: Dimensions.spacing.md,
              fontSize: Fonts.size.lg,
              textAlign: 'center',
            }}>
            ❓
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.textPrimary,
              flex: 1,
            }}>
            Help
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};
