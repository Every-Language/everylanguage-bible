import React from 'react';
import { View, StyleSheet, Text, Linking } from 'react-native';
import { BaseMenu } from './BaseMenu';
import { BaseMenuConfig } from '@/types/menu';
import { useTheme } from '@/shared/store';
import { Dimensions, Fonts } from '@/shared/constants';

// Import utility icons
import helpIcon from '../../../../assets/images/utility_icons/help.png';

interface HelpMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({ isVisible, onClose }) => {
  const { colors } = useTheme();

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log(`Don't know how to open URL: ${url}`);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const styles = StyleSheet.create({
    aboutSection: {
      alignItems: 'center',
      paddingVertical: Dimensions.spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary + '20',
      marginBottom: Dimensions.spacing.lg,
    },
    appName: {
      fontSize: Fonts.size['2xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginBottom: Dimensions.spacing.xs,
    },
    appVersion: {
      fontSize: Fonts.size.base,
      color: colors.secondary,
      marginBottom: Dimensions.spacing.md,
    },
    appDescription: {
      fontSize: Fonts.size.base,
      color: colors.secondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: Dimensions.spacing.md,
    },
  });

  const aboutSection = (
    <View style={styles.aboutSection}>
      <Text style={styles.appName}>Bible App</Text>
      <Text style={styles.appVersion}>Version 1.0.0</Text>
      <Text style={styles.appDescription}>
        Read, listen, and study the Bible with powerful tools and features
        designed to enhance your spiritual journey.
      </Text>
    </View>
  );

  const config: BaseMenuConfig = {
    title: 'Help & Support',
    fullScreen: true,
    testID: 'help-menu',
    sections: [
      {
        title: 'Help & Learning',
        options: [
          {
            key: 'getting-started',
            icon: helpIcon,
            label: 'Getting Started Guide',
            description: 'Learn the basics of using the Bible app',
            onPress: () => console.log('Getting Started Guide pressed'),
          },
          {
            key: 'user-manual',
            icon: helpIcon,
            label: 'User Manual',
            description: 'Complete guide to all features and functions',
            onPress: () => console.log('User Manual pressed'),
          },
          {
            key: 'faq',
            icon: helpIcon,
            label: 'Frequently Asked Questions',
            description: 'Find answers to common questions',
            onPress: () => console.log('FAQ pressed'),
          },
          {
            key: 'video-tutorials',
            icon: helpIcon,
            label: 'Video Tutorials',
            description: 'Watch step-by-step video guides',
            onPress: () => console.log('Video Tutorials pressed'),
          },
        ],
      },
      {
        title: 'Support',
        options: [
          {
            key: 'contact-support',
            icon: helpIcon,
            label: 'Contact Support',
            description: 'Get help from our support team',
            onPress: () => handleLinkPress('mailto:support@biblejapp.com'),
          },
          {
            key: 'report-bug',
            icon: helpIcon,
            label: 'Report a Bug',
            description: 'Let us know about issues you encounter',
            onPress: () => console.log('Report Bug pressed'),
          },
          {
            key: 'feature-request',
            icon: helpIcon,
            label: 'Feature Request',
            description: 'Suggest new features for the app',
            onPress: () => console.log('Feature Request pressed'),
          },
          {
            key: 'community-forum',
            icon: helpIcon,
            label: 'Community Forum',
            description: 'Connect with other users and get tips',
            onPress: () => handleLinkPress('https://community.bibleapp.com'),
          },
        ],
      },
      {
        title: 'Legal',
        options: [
          {
            key: 'privacy-policy',
            icon: helpIcon,
            label: 'Privacy Policy',
            description: 'How we protect and use your data',
            onPress: () => handleLinkPress('https://bibleapp.com/privacy'),
          },
          {
            key: 'terms-of-service',
            icon: helpIcon,
            label: 'Terms of Service',
            description: 'Legal terms and conditions',
            onPress: () => handleLinkPress('https://bibleapp.com/terms'),
          },
          {
            key: 'licenses',
            icon: helpIcon,
            label: 'Open Source Licenses',
            description: 'Third-party software licenses',
            onPress: () => console.log('Licenses pressed'),
          },
        ],
      },
    ],
  };

  return (
    <BaseMenu
      isVisible={isVisible}
      onClose={onClose}
      config={config}
      customContent={aboutSection}
    />
  );
};
