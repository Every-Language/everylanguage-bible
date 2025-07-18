import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import {
  AudioVersionSelector,
  TextVersionSelector,
  VersionSelectionModal,
  LanguageHierarchyBrowser,
} from '../components';
import {
  useLanguageSelection,
  useCurrentVersions,
  useSavedVersions,
} from '../hooks';
import { AudioVersion, TextVersion } from '../types';

export const LanguageSelectionDemoScreen: React.FC = () => {
  const { theme } = useTheme();
  const { navigateToLanguage, loadLanguageHierarchy } = useLanguageSelection();

  const { currentAudioVersion, currentTextVersion } = useCurrentVersions();

  const {
    savedAudioVersions,
    savedTextVersions,
    addSavedVersion,
    removeSavedVersion,
  } = useSavedVersions();

  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showLanguageBrowser, setShowLanguageBrowser] = useState(false);

  const handleAudioVersionSelect = (version: AudioVersion) => {
    console.log('Selected audio version:', version);
    setShowAudioModal(false);
  };

  const handleTextVersionSelect = (version: TextVersion) => {
    console.log('Selected text version:', version);
    setShowTextModal(false);
  };

  const handleLanguageSelect = (language: any) => {
    console.log('Selected language:', language);
    navigateToLanguage(language);
    setShowLanguageBrowser(false);
  };

  const handleVersionAdd = async (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => {
    await addSavedVersion(version, type);
    if (type === 'audio') {
      handleAudioVersionSelect(version as AudioVersion);
    } else {
      handleTextVersionSelect(version as TextVersion);
    }
  };

  const handleVersionRemove = async (
    versionId: string,
    type: 'audio' | 'text'
  ) => {
    await removeSavedVersion(versionId, type);
  };

  React.useEffect(() => {
    // Load language hierarchy on mount
    loadLanguageHierarchy();
  }, [loadLanguageHierarchy]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Language Selection Demo
      </Text>

      {/* Current Versions Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Current Versions
        </Text>

        <View style={styles.versionRow}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Audio:
          </Text>
          <AudioVersionSelector
            currentVersion={currentAudioVersion}
            onPress={() => setShowAudioModal(true)}
          />
        </View>

        <View style={styles.versionRow}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Text:
          </Text>
          <TextVersionSelector
            currentVersion={currentTextVersion}
            onPress={() => setShowTextModal(true)}
          />
        </View>
      </View>

      {/* Saved Versions Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Saved Versions ({savedAudioVersions.length} audio,{' '}
          {savedTextVersions.length} text)
        </Text>

        {savedAudioVersions.length === 0 && savedTextVersions.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            No saved versions yet. Use the version selectors above to add some!
          </Text>
        )}
      </View>

      {/* Language Browser Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Language Browser
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowLanguageBrowser(true)}>
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Browse Languages
          </Text>
        </TouchableOpacity>
      </View>

      {/* Audio Version Selection Modal */}
      <VersionSelectionModal
        isVisible={showAudioModal}
        onClose={() => setShowAudioModal(false)}
        versionType='audio'
        savedVersions={savedAudioVersions}
        currentVersion={currentAudioVersion}
        onVersionSelect={handleAudioVersionSelect}
        onVersionAdd={handleVersionAdd}
        onVersionRemove={handleVersionRemove}
        title='Select Audio Version'
      />

      {/* Text Version Selection Modal */}
      <VersionSelectionModal
        isVisible={showTextModal}
        onClose={() => setShowTextModal(false)}
        versionType='text'
        savedVersions={savedTextVersions}
        currentVersion={currentTextVersion}
        onVersionSelect={handleTextVersionSelect}
        onVersionAdd={handleVersionAdd}
        onVersionRemove={handleVersionRemove}
        title='Select Text Version'
      />

      {/* Language Hierarchy Browser Modal */}
      <LanguageHierarchyBrowser
        isVisible={showLanguageBrowser}
        onClose={() => setShowLanguageBrowser(false)}
        onLanguageSelect={handleLanguageSelect}
        onVersionAdd={handleVersionAdd}
        title='Browse Languages'
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginRight: 12,
    minWidth: 60,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
