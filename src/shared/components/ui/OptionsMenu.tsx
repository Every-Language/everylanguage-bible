import React, { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { BaseMenu } from './BaseMenu';
import { CodeEntryModal } from './CodeEntryModal';
import { BaseMenuConfig } from '@/types/menu';
import { useCalculatorMode } from '@/shared/store';

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
  onNavigateToSubMenu?: (
    subMenuType: 'profile' | 'language' | 'settings' | 'help'
  ) => void;
}

export const OptionsMenu: React.FC<OptionsMenuProps> = ({
  isVisible,
  onClose,
  onThemeToggle: _onThemeToggle,
  onNavigateToSubMenu,
}) => {
  const { enterCalculatorMode } = useCalculatorMode();
  const [isCodeEntryVisible, setIsCodeEntryVisible] = useState(false);

  const handleSubMenuNavigation = (
    subMenuType: 'profile' | 'language' | 'settings' | 'help'
  ) => {
    if (onNavigateToSubMenu) {
      onNavigateToSubMenu(subMenuType);
    } else {
      console.log(`${subMenuType} pressed`);
      onClose();
    }
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
            text: 'Enter',
            onPress: (code?: string) => {
              if (code && code.length === 4 && /^\d{4}$/.test(code)) {
                enterCalculatorMode(code);
                onClose();
              } else {
                Alert.alert('Invalid Code', 'Please enter exactly 4 digits.');
              }
            },
          },
        ],
        'plain-text',
        '',
        'number-pad'
      );
    } else {
      // Android: Use custom modal
      setIsCodeEntryVisible(true);
    }
  };

  const handleCodeEntrySuccess = (code: string) => {
    setIsCodeEntryVisible(false);
    enterCalculatorMode(code);
    onClose();
  };

  const config: BaseMenuConfig = {
    title: 'Options',
    fullScreen: false,
    testID: 'options-menu',
    options: [
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
        onPress: () => handleSubMenuNavigation('profile'),
      },
      {
        key: 'language',
        icon: languageIcon,
        label: 'Language',
        onPress: () => handleSubMenuNavigation('language'),
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
        label: 'Settings',
        onPress: () => handleSubMenuNavigation('settings'),
      },
      {
        key: 'help',
        icon: helpIcon,
        label: 'Help',
        onPress: () => handleSubMenuNavigation('help'),
      },
    ],
  };

  return (
    <>
      <BaseMenu isVisible={isVisible} onClose={onClose} config={config} />

      <CodeEntryModal
        isVisible={isCodeEntryVisible}
        onClose={() => setIsCodeEntryVisible(false)}
        onSuccess={handleCodeEntrySuccess}
      />
    </>
  );
};
