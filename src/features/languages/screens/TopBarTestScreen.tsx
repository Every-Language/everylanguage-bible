import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { TopBar } from '@/shared/components/TopBar';

export const TopBarTestScreen: React.FC = () => {
  const { theme } = useTheme();

  const handleProfilePress = () => {
    console.log('Profile pressed');
  };

  const handleSyncPress = () => {
    console.log('Sync pressed');
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* TopBar with Language Selection enabled */}
      <TopBar
        title='Language Selection Test'
        showProfile={true}
        showThemeToggle={true}
        showSyncStatus={true}
        showLanguageSelection={true} // This enables the language selection buttons!
        onProfilePress={handleProfilePress}
        onSyncPress={handleSyncPress}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          TopBar Language Selection Test
        </Text>

        <Text style={[styles.description, { color: theme.colors.text }]}>
          The TopBar above now includes Audio and Text version selector buttons.
        </Text>

        <View style={styles.instructionsContainer}>
          <Text
            style={[styles.instructionsTitle, { color: theme.colors.text }]}>
            Instructions:
          </Text>

          <Text style={[styles.instruction, { color: theme.colors.text }]}>
            1. Look at the TopBar above - you should see small Audio and Text
            selector buttons
          </Text>

          <Text style={[styles.instruction, { color: theme.colors.text }]}>
            2. Tap on the Audio button to open the audio version selection modal
          </Text>

          <Text style={[styles.instruction, { color: theme.colors.text }]}>
            3. Tap on the Text button to open the text version selection modal
          </Text>

          <Text style={[styles.instruction, { color: theme.colors.text }]}>
            4. The modals will show your saved versions and allow you to browse
            for new ones
          </Text>
        </View>

        <View
          style={[
            styles.codeExample,
            { backgroundColor: theme.colors.surface },
          ]}>
          <Text style={[styles.codeTitle, { color: theme.colors.text }]}>
            Usage Example:
          </Text>

          <Text style={[styles.code, { color: theme.colors.text }]}>
            {`<TopBar
  title="My App"
  showLanguageSelection={true}
  onProfilePress={handleProfile}
/>`}
          </Text>
        </View>

        <View
          style={[
            styles.featureList,
            { backgroundColor: theme.colors.surface },
          ]}>
          <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
            Features:
          </Text>

          <Text style={[styles.feature, { color: theme.colors.text }]}>
            ✓ Compact audio/text version selectors in TopBar
          </Text>

          <Text style={[styles.feature, { color: theme.colors.text }]}>
            ✓ Modal-based version selection
          </Text>

          <Text style={[styles.feature, { color: theme.colors.text }]}>
            ✓ Browse language hierarchy to find new versions
          </Text>

          <Text style={[styles.feature, { color: theme.colors.text }]}>
            ✓ Save/manage your preferred versions
          </Text>

          <Text style={[styles.feature, { color: theme.colors.text }]}>
            ✓ Automatic sync with background updates
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
    textAlign: 'center',
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  codeExample: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  codeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  code: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  featureList: {
    padding: 16,
    borderRadius: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
});
