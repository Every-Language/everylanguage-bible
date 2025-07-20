import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';

interface MotherTongueSearchScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

interface Language {
  id: string;
  name: string;
  nativeName: string;
  code: string;
}

const sampleLanguages: Language[] = [
  { id: '1', name: 'English', nativeName: 'English', code: 'en' },
  { id: '2', name: 'Spanish', nativeName: 'Español', code: 'es' },
  { id: '3', name: 'French', nativeName: 'Français', code: 'fr' },
  { id: '4', name: 'German', nativeName: 'Deutsch', code: 'de' },
  { id: '5', name: 'Portuguese', nativeName: 'Português', code: 'pt' },
  { id: '6', name: 'Russian', nativeName: 'Русский', code: 'ru' },
  { id: '7', name: 'Chinese', nativeName: '中文', code: 'zh' },
  { id: '8', name: 'Japanese', nativeName: '日本語', code: 'ja' },
  { id: '9', name: 'Korean', nativeName: '한국어', code: 'ko' },
  { id: '10', name: 'Arabic', nativeName: 'العربية', code: 'ar' },
  { id: '11', name: 'Hindi', nativeName: 'हिन्दी', code: 'hi' },
  { id: '12', name: 'Italian', nativeName: 'Italiano', code: 'it' },
];

export const MotherTongueSearchScreen: React.FC<
  MotherTongueSearchScreenProps
> = ({ onBack, onComplete }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null
  );

  const filteredLanguages = sampleLanguages.filter(
    lang =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      // Here you would typically save the selected language
      onComplete();
    }
  };

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        {
          backgroundColor: theme.colors.surface,
          borderColor:
            selectedLanguage?.id === item.id
              ? theme.colors.primary
              : theme.colors.border,
        },
      ]}
      onPress={() => handleLanguageSelect(item)}>
      <View style={styles.languageInfo}>
        <Text style={[styles.languageName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <Text
          style={[styles.nativeName, { color: theme.colors.textSecondary }]}>
          {item.nativeName}
        </Text>
      </View>
      {selectedLanguage?.id === item.id && (
        <View
          style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text
            style={[styles.backButtonText, { color: theme.colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Select Your Mother Tongue
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Choose your preferred language for the app
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder='Search languages...'
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredLanguages}
        renderItem={renderLanguageItem}
        keyExtractor={item => item.id}
        style={styles.languageList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedLanguage
                ? theme.colors.primary
                : theme.colors.interactiveDisabled,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedLanguage}>
          <Text
            style={[
              styles.continueButtonText,
              { color: theme.colors.textInverse },
            ]}>
            Continue
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
    paddingBottom: 10,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  languageList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  nativeName: {
    fontSize: 14,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
  },
  continueButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
