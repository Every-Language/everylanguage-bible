import React from 'react';
import { ImageSourcePropType } from 'react-native';

// Base menu option interface
export interface BaseMenuOption {
  key: string;
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
}

// Extended option with description for help/settings
export interface MenuOptionWithDescription extends BaseMenuOption {
  description?: string;
}

// Toggle option for settings
export interface ToggleMenuOption extends BaseMenuOption {
  value: boolean;
  onToggle: () => void;
}

// Language option for language menu
export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

// Section configuration for multi-section menus
export interface MenuSection {
  title?: string;
  options: (BaseMenuOption | MenuOptionWithDescription | ToggleMenuOption)[];
}

// Header configuration for profile-like menus
export interface MenuHeader {
  avatarSource?: ImageSourcePropType;
  title?: string;
  subtitle?: string;
}

// Base menu configuration
export interface BaseMenuConfig {
  title: string;
  fullScreen?: boolean;
  testID: string;
  header?: MenuHeader;
  sections?: MenuSection[];
  options?: (BaseMenuOption | MenuOptionWithDescription | ToggleMenuOption)[];
}

// Props for base menu component
export interface BaseMenuProps {
  isVisible: boolean;
  onClose: () => void;
  config: BaseMenuConfig;
  customContent?: React.ReactNode;
}
