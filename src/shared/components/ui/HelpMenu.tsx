import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import { SlideUpPanel } from './SlideUpPanel';
import { useTheme } from '@/shared/store';
import { Dimensions, Fonts } from '@/shared/constants';

// Import utility icons
import helpIcon from '../../../../assets/images/utility_icons/help.png';

interface HelpMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({ isVisible, onClose }) => {
  const { colors, isDark } = useTheme();

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

  const helpOptions = [
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
  ];

  const supportOptions = [
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
  ];

  const legalOptions = [
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
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: Dimensions.spacing.md,
    },
    sectionHeader: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginBottom: Dimensions.spacing.md,
      marginTop: Dimensions.spacing.lg,
    },
    helpCard: {
      backgroundColor: isDark ? '#414141' : '#EAE9E7',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.sm,
      minHeight: 65,
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
    helpInfo: {
      flex: 1,
    },
    helpLabel: {
      fontSize: Fonts.size.base,
      color: colors.text,
      fontWeight: Fonts.weight.medium,
      marginBottom: 2,
    },
    helpDescription: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
      lineHeight: 18,
    },
    aboutSection: {
      backgroundColor: colors.secondary + '10',
      borderRadius: Dimensions.radius.md,
      padding: Dimensions.spacing.lg,
      marginBottom: Dimensions.spacing.lg,
      alignItems: 'center',
    },
    appName: {
      fontSize: Fonts.size.xl,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginBottom: Dimensions.spacing.xs,
    },
    appVersion: {
      fontSize: Fonts.size.base,
      color: colors.secondary,
      marginBottom: Dimensions.spacing.sm,
    },
    appDescription: {
      fontSize: Fonts.size.sm,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <SlideUpPanel
      isVisible={isVisible}
      onClose={onClose}
      title='Help & Support'
      fullScreen={true}
      testID='help-menu'>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.appName}>Bible App</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Read, listen, and study the Bible with powerful tools and features
            designed to enhance your spiritual journey.
          </Text>
        </View>

        {/* Help & Learning */}
        <Text style={styles.sectionHeader}>Help & Learning</Text>
        {helpOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={styles.helpCard}
            onPress={option.onPress}
            accessibilityLabel={option.label}
            accessibilityRole='button'
            testID={`help-menu-${option.key}`}>
            <View style={styles.iconContainer}>
              <Image
                source={option.icon}
                style={styles.icon}
                resizeMode='contain'
              />
            </View>
            <View style={styles.helpInfo}>
              <Text style={styles.helpLabel}>{option.label}</Text>
              <Text style={styles.helpDescription}>{option.description}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Support */}
        <Text style={styles.sectionHeader}>Support</Text>
        {supportOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={styles.helpCard}
            onPress={option.onPress}
            accessibilityLabel={option.label}
            accessibilityRole='button'
            testID={`help-menu-${option.key}`}>
            <View style={styles.iconContainer}>
              <Image
                source={option.icon}
                style={styles.icon}
                resizeMode='contain'
              />
            </View>
            <View style={styles.helpInfo}>
              <Text style={styles.helpLabel}>{option.label}</Text>
              <Text style={styles.helpDescription}>{option.description}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Legal */}
        <Text style={styles.sectionHeader}>Legal</Text>
        {legalOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={styles.helpCard}
            onPress={option.onPress}
            accessibilityLabel={option.label}
            accessibilityRole='button'
            testID={`help-menu-${option.key}`}>
            <View style={styles.iconContainer}>
              <Image
                source={option.icon}
                style={styles.icon}
                resizeMode='contain'
              />
            </View>
            <View style={styles.helpInfo}>
              <Text style={styles.helpLabel}>{option.label}</Text>
              <Text style={styles.helpDescription}>{option.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SlideUpPanel>
  );
};
