import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { SlideUpPanel } from './SlideUpPanel';
import { useTheme } from '@/shared/store';
import { Dimensions, Fonts } from '@/shared/constants';

// Import utility icons
import searchIcon from '../../../../assets/images/utility_icons/search.png';
import profileIcon from '../../../../assets/images/utility_icons/profile.png';
import languageIcon from '../../../../assets/images/utility_icons/language.png';
import calculatorIcon from '../../../../assets/images/utility_icons/calculator.png';
import settingsIcon from '../../../../assets/images/utility_icons/settings.png';
import helpIcon from '../../../../assets/images/utility_icons/help.png';

interface OptionsMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onThemeToggle: () => void;
}

export const OptionsMenu: React.FC<OptionsMenuProps> = ({
  isVisible,
  onClose,
  onThemeToggle,
}) => {
  const { colors, isDark } = useTheme();

  const handleOptionPress = (action: () => void) => {
    action();
    onClose();
  };

  const menuOptions = [
    {
      key: 'search',
      icon: searchIcon,
      label: 'Search',
      onPress: () => console.log('Search pressed'),
    },
    {
      key: 'profile',
      icon: profileIcon,
      label: 'Profile',
      onPress: () => console.log('Profile pressed'),
    },
    {
      key: 'language',
      icon: languageIcon,
      label: 'Language',
      onPress: () => console.log('Language pressed'),
    },
    {
      key: 'calculator',
      icon: calculatorIcon,
      label: 'Calculator',
      onPress: () => console.log('Calculator pressed'),
    },
    {
      key: 'settings',
      icon: settingsIcon,
      label: 'Settings',
      onPress: () => console.log('Settings pressed'),
    },
    {
      key: 'help',
      icon: helpIcon,
      label: 'Help',
      onPress: () => console.log('Help pressed'),
    },
  ];

  const styles = StyleSheet.create({
    container: {
      paddingVertical: Dimensions.spacing.md,
    },
    cardsContainer: {
      gap: Dimensions.spacing.sm,
    },
    optionCard: {
      backgroundColor: '#CCBB99',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
    },
    iconContainer: {
      width: 32,
      height: 32,
      marginRight: Dimensions.spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      width: 24,
      height: 24,
      tintColor: colors.text,
    },
    label: {
      fontSize: Fonts.size.base,
      color: colors.text,
      flex: 1,
      fontWeight: Fonts.weight.medium,
    },
    themeToggleContainer: {
      marginTop: Dimensions.spacing.md,
      paddingTop: Dimensions.spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.primary + '20',
    },
    themeToggleButton: {
      backgroundColor: '#CCBB99',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    themeToggleText: {
      fontSize: Fonts.size.base,
      color: colors.text,
      fontWeight: Fonts.weight.medium,
      marginLeft: Dimensions.spacing.sm,
    },
  });

  return (
    <SlideUpPanel
      isVisible={isVisible}
      onClose={onClose}
      title='Options'
      fullScreen={false}
      testID='options-menu'>
      <View style={styles.container}>
        <View style={styles.cardsContainer}>
          {menuOptions.map(option => (
            <TouchableOpacity
              key={option.key}
              style={styles.optionCard}
              onPress={() => handleOptionPress(option.onPress)}
              accessibilityLabel={option.label}
              accessibilityRole='button'
              testID={`options-menu-${option.key}`}>
              <View style={styles.iconContainer}>
                <Image
                  source={option.icon}
                  style={styles.icon}
                  resizeMode='contain'
                />
              </View>
              <Text style={styles.label}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Toggle Button */}
        <View style={styles.themeToggleContainer}>
          <TouchableOpacity
            style={styles.themeToggleButton}
            onPress={() => handleOptionPress(onThemeToggle)}
            accessibilityLabel={
              isDark ? 'Switch to light mode' : 'Switch to dark mode'
            }
            accessibilityRole='button'
            testID='options-menu-theme-toggle'>
            <Text style={{ fontSize: Fonts.size.lg }}>
              {isDark ? '☀️' : '🌙'}
            </Text>
            <Text style={styles.themeToggleText}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SlideUpPanel>
  );
};
