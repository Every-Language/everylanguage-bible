import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SlideUpPanel } from './SlideUpPanel';
import { useTheme } from '@/shared/store';
import { Dimensions, Fonts } from '@/shared/constants';

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
  const { colors, isDark } = useTheme();

  const profileOptions = [
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
  ];

  const handleOptionPress = (action: () => void) => {
    action();
    // Keep menu open for now, could close on certain actions
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: Dimensions.spacing.md,
    },
    headerSection: {
      alignItems: 'center',
      paddingVertical: Dimensions.spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary + '20',
      marginBottom: Dimensions.spacing.lg,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? '#414141' : '#EAE9E7',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.md,
    },
    avatarText: {
      fontSize: Fonts.size['2xl'],
      color: '#FFFFFF',
      fontWeight: Fonts.weight.bold,
    },
    userName: {
      fontSize: Fonts.size.xl,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginBottom: Dimensions.spacing.xs,
    },
    userEmail: {
      fontSize: Fonts.size.base,
      color: colors.secondary,
    },
    optionsContainer: {
      gap: Dimensions.spacing.sm,
    },
    optionCard: {
      backgroundColor: isDark ? '#414141' : '#EAE9E7',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 50,
    },
    iconContainer: {
      width: 24,
      height: 24,
      marginRight: Dimensions.spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      width: 20,
      height: 20,
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
    <SlideUpPanel
      isVisible={isVisible}
      onClose={onClose}
      title='Profile'
      fullScreen={true}
      testID='profile-menu'>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userEmail}>john.doe@example.com</Text>
        </View>

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          {profileOptions.map(option => (
            <TouchableOpacity
              key={option.key}
              style={styles.optionCard}
              onPress={() => handleOptionPress(option.onPress)}
              accessibilityLabel={option.label}
              accessibilityRole='button'
              testID={`profile-menu-${option.key}`}>
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
      </ScrollView>
    </SlideUpPanel>
  );
};
