import React from 'react';
import { BaseMenu } from './BaseMenu';
import { BaseMenuConfig } from '@/types/menu';

// Import utility icons
import profileIcon from '../../../../assets/images/utility_icons/profile.png';

interface ProfileMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isVisible,
  onClose,
}) => {
  const config: BaseMenuConfig = {
    title: 'Profile',
    fullScreen: true,
    testID: 'profile-menu',
    header: {
      avatarSource: profileIcon,
      title: 'Luke Bilhorn',
      subtitle: 'luke.bilhorn@example.com',
    },
    options: [
      {
        key: 'account-info',
        icon: profileIcon,
        label: 'Account Information',
        onPress: () => console.log('Account Information pressed'),
      },
      {
        key: 'reading-progress',
        icon: profileIcon,
        label: 'Reading Progress',
        onPress: () => console.log('Reading Progress pressed'),
      },
      {
        key: 'bookmarks',
        icon: profileIcon,
        label: 'Bookmarks & Notes',
        onPress: () => console.log('Bookmarks pressed'),
      },
      {
        key: 'achievements',
        icon: profileIcon,
        label: 'Achievements',
        onPress: () => console.log('Achievements pressed'),
      },
      {
        key: 'sign-out',
        icon: profileIcon,
        label: 'Sign Out',
        onPress: () => console.log('Sign Out pressed'),
      },
    ],
  };

  return <BaseMenu isVisible={isVisible} onClose={onClose} config={config} />;
};
