import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import { useNetworkForAction } from '@/shared/hooks/useNetworkState';
import { NoInternetModal, SyncProgressModal } from '@/shared/components';

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
  const { isOnline, isChecking, ensureNetworkAvailable, retryAndExecute } =
    useNetworkForAction();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null
  );
  const [showNoInternetModal, setShowNoInternetModal] = useState(false);
  const [showSyncProgressModal, setShowSyncProgressModal] = useState(false);

  const filteredLanguages = sampleLanguages.filter(
    lang =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Debug logging for network state
  useEffect(() => {
    console.log('MotherTongueSearchScreen: Network state debug:', {
      isOnline,
      isChecking,
      timestamp: new Date().toISOString(),
    });
  }, [isOnline, isChecking]);

  // Check for internet connectivity when component mounts
  useEffect(() => {
    if (!isOnline && !isChecking) {
      console.log(
        'MotherTongueSearchScreen: No internet detected, showing modal'
      );
      setShowNoInternetModal(true);
    } else {
      console.log(
        'MotherTongueSearchScreen: Internet available or checking, hiding modal'
      );
      setShowNoInternetModal(false);
    }
  }, [isOnline, isChecking]);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const handleContinue = async () => {
    if (selectedLanguage) {
      try {
        // Ensure network is available before proceeding
        await ensureNetworkAvailable(() => {
          // Show sync progress modal instead of immediately completing
          setShowSyncProgressModal(true);
        });
      } catch (error) {
        console.log(
          'MotherTongueSearchScreen: Network not available for continue action:',
          error
        );
        setShowNoInternetModal(true);
      }
    }
  };

  const handleRetryConnection = async () => {
    try {
      // Use the retry and execute method
      await retryAndExecute(() => {
        setShowNoInternetModal(false);
      });
    } catch (error) {
      console.log('MotherTongueSearchScreen: Retry failed:', error);
      // Modal will stay open if retry fails
    }
  };

  const handleDebugNetworkCheck = async () => {
    console.log('MotherTongueSearchScreen: Debug network check triggered');
    try {
      await retryAndExecute(() => {
        console.log('MotherTongueSearchScreen: Debug check successful');
      });
    } catch (error) {
      console.log('MotherTongueSearchScreen: Debug check failed:', error);
    }
  };

  const handleTestEndpoints = async () => {
    console.log('MotherTongueSearchScreen: Testing individual endpoints...');
    const { networkService } = await import(
      '@/shared/services/network/NetworkService'
    );

    const endpoints = [
      'https://httpbin.org/get',
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://api.github.com/zen',
      'https://www.cloudflare.com/cdn-cgi/trace',
      'https://www.google.com/favicon.ico',
    ];

    for (const endpoint of endpoints) {
      try {
        const result = await networkService.testSingleEndpoint(endpoint);
        console.log(
          `MotherTongueSearchScreen: ${endpoint} - ${result.isOnline ? 'SUCCESS' : 'FAILED'} (${result.latency}ms)`,
          result.error || ''
        );
      } catch (error) {
        console.log(`MotherTongueSearchScreen: ${endpoint} - ERROR:`, error);
      }
    }
  };

  const handleGetStarted = () => {
    // Navigate to home screen when sync is complete
    onComplete();
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
          <MaterialIcons
            name='arrow-back'
            size={24}
            color={theme.colors.primary}
            style={styles.backIcon}
          />
          <Text
            style={[styles.backButtonText, { color: theme.colors.primary }]}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Select Your Mother Tongue
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Choose your preferred language for the app
        </Text>
      </View>

      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => {
          // Only show modal if there's no internet connection
          if (!isOnline) {
            setShowNoInternetModal(true);
          }
        }}
        activeOpacity={0.7}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.colors.surface,
                color: isOnline
                  ? theme.colors.text
                  : theme.colors.textSecondary,
                borderColor: isOnline
                  ? theme.colors.border
                  : theme.colors.error,
              },
            ]}
            placeholder={
              isOnline ? 'Search languages...' : 'No internet connection'
            }
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={isOnline}
          />
          {!isOnline && (
            <MaterialIcons
              name='wifi-off'
              size={20}
              color={theme.colors.error}
              style={styles.searchIcon}
            />
          )}
        </View>
      </TouchableOpacity>

      <FlatList
        data={filteredLanguages}
        renderItem={renderLanguageItem}
        keyExtractor={item => item.id}
        style={styles.languageList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        {/* Debug button - remove in production */}
        <TouchableOpacity
          style={[
            styles.debugButton,
            { backgroundColor: theme.colors.warning },
          ]}
          onPress={handleDebugNetworkCheck}>
          <Text
            style={[
              styles.debugButtonText,
              { color: theme.colors.textInverse },
            ]}>
            Debug: Check Network ({isOnline ? 'Online' : 'Offline'})
          </Text>
        </TouchableOpacity>

        {/* Debug endpoint test button - remove in production */}
        <TouchableOpacity
          style={[styles.debugButton, { backgroundColor: theme.colors.info }]}
          onPress={handleTestEndpoints}>
          <Text
            style={[
              styles.debugButtonText,
              { color: theme.colors.textInverse },
            ]}>
            Debug: Test Endpoints
          </Text>
        </TouchableOpacity>

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

      <NoInternetModal
        visible={showNoInternetModal && !isOnline}
        onRetry={handleRetryConnection}
        onClose={() => setShowNoInternetModal(false)}
      />

      <SyncProgressModal
        visible={showSyncProgressModal}
        onClose={() => setShowSyncProgressModal(false)}
        onGetStarted={handleGetStarted}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    marginRight: 8,
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
  searchInputContainer: {
    position: 'relative',
  },
  searchInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    borderWidth: 1,
  },
  searchIcon: {
    position: 'absolute',
    right: 16,
    top: 15,
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
  debugButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  debugButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
