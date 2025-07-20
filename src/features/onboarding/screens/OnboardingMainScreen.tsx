import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';

interface OnboardingMainScreenProps {
  onNavigateToMotherTongue: () => void;
  onNavigateToImportBible: () => void;
  onComplete: () => void;
}

export const OnboardingMainScreen: React.FC<OnboardingMainScreenProps> = ({
  onNavigateToMotherTongue,
  onNavigateToImportBible,
  onComplete,
}) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Welcome to Bible App
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Let&apos;s set up your personalized Bible experience
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={onNavigateToMotherTongue}>
          <View style={styles.cardIcon}>
            <Text style={styles.iconText}>🌍</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Choose Your Language
            </Text>
            <Text
              style={[
                styles.cardDescription,
                { color: theme.colors.textSecondary },
              ]}>
              Select your mother tongue for the best reading experience
            </Text>
          </View>
          <View
            style={[
              styles.arrowContainer,
              { backgroundColor: theme.colors.primary },
            ]}>
            <Text style={[styles.arrow, { color: theme.colors.textInverse }]}>
              →
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={onNavigateToImportBible}>
          <View style={styles.cardIcon}>
            <Text style={styles.iconText}>📖</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Import Bible Content
            </Text>
            <Text
              style={[
                styles.cardDescription,
                { color: theme.colors.textSecondary },
              ]}>
              Download Bible versions and audio for offline access
            </Text>
          </View>
          <View
            style={[
              styles.arrowContainer,
              { backgroundColor: theme.colors.primary },
            ]}>
            <Text style={[styles.arrow, { color: theme.colors.textInverse }]}>
              →
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.skipButton, { borderColor: theme.colors.border }]}
          onPress={onComplete}>
          <Text
            style={[
              styles.skipButtonText,
              { color: theme.colors.textSecondary },
            ]}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  skipButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
