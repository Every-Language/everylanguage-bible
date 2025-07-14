import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SlideUpPanel } from './SlideUpPanel';
import { CodeEntryModal } from './CodeEntryModal';
import { useTheme, useCalculatorMode } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';
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
  onThemeToggle: _onThemeToggle,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { enterCalculatorMode } = useCalculatorMode();
  const [isCodeEntryVisible, setIsCodeEntryVisible] = useState(false);

  const handleOptionPress = (action: () => void) => {
    action();
    onClose();
  };

  const handleCalculatorPress = () => {
    if (Platform.OS === 'ios') {
      // iOS: Use native Alert.prompt
      Alert.prompt(
        'Enter 4-Digit Code',
        'Are you sure you want to enter a calculator mode? You will not be able to get back into the app if you forget your code.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: code => {
              if (code && code.length === 4 && /^\d{4}$/.test(code)) {
                // First code entered, now ask for confirmation
                Alert.prompt(
                  'Confirm Code',
                  'Please enter the same 4-digit code again to confirm:',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'OK',
                      onPress: confirmCode => {
                        if (confirmCode === code) {
                          enterCalculatorMode(code);
                          console.log('Calculator mode activated');
                        } else {
                          Alert.alert(
                            'Code Mismatch',
                            'The codes do not match. Please try again.'
                          );
                        }
                      },
                    },
                  ],
                  'plain-text',
                  '',
                  'numeric'
                );
              } else {
                Alert.alert('Invalid Code', 'Please enter exactly 4 digits.');
              }
            },
          },
        ],
        'plain-text',
        '',
        'numeric'
      );
    } else {
      // Android: Use custom modal
      setIsCodeEntryVisible(true);
    }
  };

  const handleCodeEntrySuccess = (code: string) => {
    enterCalculatorMode(code);
    console.log('Calculator mode activated');
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
      onPress: handleCalculatorPress,
    },
    {
      key: 'settings',
      icon: settingsIcon,
      label: isDark ? t('theme.switchToLight') : t('theme.switchToDark'),
      onPress: () => _onThemeToggle(),
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
      backgroundColor: '#AC8F57',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 40,
    },
    iconContainer: {
      width: 20,
      height: 20,
      marginRight: Dimensions.spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      width: 18,
      height: 18,
      tintColor: colors.text,
    },
    label: {
      fontSize: Fonts.size.base,
      color: colors.text,
      flex: 1,
      fontWeight: Fonts.weight.medium,
    },
  });

  return (
    <>
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
        </View>
      </SlideUpPanel>

      <CodeEntryModal
        isVisible={isCodeEntryVisible}
        onClose={() => setIsCodeEntryVisible(false)}
        onSuccess={handleCodeEntrySuccess}
      />
    </>
  );
};
