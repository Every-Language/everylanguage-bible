import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';

interface ImportBibleScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

interface BibleVersion {
  id: string;
  name: string;
  language: string;
  type: 'text' | 'audio';
  size: string;
  isSelected: boolean;
}

const sampleBibleVersions: BibleVersion[] = [
  {
    id: '1',
    name: 'King James Version',
    language: 'English',
    type: 'text',
    size: '2.1 MB',
    isSelected: false,
  },
  {
    id: '2',
    name: 'New International Version',
    language: 'English',
    type: 'text',
    size: '2.3 MB',
    isSelected: false,
  },
  {
    id: '3',
    name: 'English Standard Version',
    language: 'English',
    type: 'text',
    size: '2.0 MB',
    isSelected: false,
  },
  {
    id: '4',
    name: 'Reina Valera 1960',
    language: 'Spanish',
    type: 'text',
    size: '2.2 MB',
    isSelected: false,
  },
  {
    id: '5',
    name: 'Louis Segond',
    language: 'French',
    type: 'text',
    size: '2.1 MB',
    isSelected: false,
  },
  {
    id: '6',
    name: 'Luther Bible 1912',
    language: 'German',
    type: 'text',
    size: '2.4 MB',
    isSelected: false,
  },
  {
    id: '7',
    name: 'KJV Audio Bible',
    language: 'English',
    type: 'audio',
    size: '45.2 MB',
    isSelected: false,
  },
  {
    id: '8',
    name: 'NIV Audio Bible',
    language: 'English',
    type: 'audio',
    size: '48.1 MB',
    isSelected: false,
  },
];

export const ImportBibleScreen: React.FC<ImportBibleScreenProps> = ({
  onBack,
  onComplete,
}) => {
  const { theme } = useTheme();
  const [bibleVersions, setBibleVersions] =
    useState<BibleVersion[]>(sampleBibleVersions);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const selectedVersions = bibleVersions.filter(version => version.isSelected);

  const handleVersionToggle = (versionId: string) => {
    setBibleVersions(prev =>
      prev.map(version =>
        version.id === versionId
          ? { ...version, isSelected: !version.isSelected }
          : version
      )
    );
  };

  const handleImport = async () => {
    if (selectedVersions.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    // Simulate import process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setImportProgress(i);
    }

    setIsImporting(false);
    onComplete();
  };

  const renderBibleVersion = (version: BibleVersion) => (
    <TouchableOpacity
      key={version.id}
      style={[
        styles.versionItem,
        {
          backgroundColor: theme.colors.surface,
          borderColor: version.isSelected
            ? theme.colors.primary
            : theme.colors.border,
        },
      ]}
      onPress={() => handleVersionToggle(version.id)}>
      <View style={styles.versionInfo}>
        <View style={styles.versionHeader}>
          <Text style={[styles.versionName, { color: theme.colors.text }]}>
            {version.name}
          </Text>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  version.type === 'audio'
                    ? theme.colors.accent
                    : theme.colors.info,
              },
            ]}>
            <Text
              style={[styles.typeText, { color: theme.colors.textInverse }]}>
              {version.type.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.versionLanguage,
            { color: theme.colors.textSecondary },
          ]}>
          {version.language}
        </Text>
        <Text
          style={[styles.versionSize, { color: theme.colors.textSecondary }]}>
          {version.size}
        </Text>
      </View>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: version.isSelected
              ? theme.colors.primary
              : 'transparent',
            borderColor: version.isSelected
              ? theme.colors.primary
              : theme.colors.border,
          },
        ]}>
        {version.isSelected && (
          <Text style={[styles.checkmark, { color: theme.colors.textInverse }]}>
            ✓
          </Text>
        )}
      </View>
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
          Import Bible Content
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Select Bible versions to download and store locally
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.versionsContainer}>
          {bibleVersions.map(renderBibleVersion)}
        </View>
      </ScrollView>

      {isImporting && (
        <View style={styles.importOverlay}>
          <View
            style={[
              styles.importModal,
              { backgroundColor: theme.colors.surface },
            ]}>
            <Text style={[styles.importTitle, { color: theme.colors.text }]}>
              Importing Bible Content
            </Text>
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: theme.colors.border },
                ]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${importProgress}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.progressText,
                  { color: theme.colors.textSecondary },
                ]}>
                {importProgress}%
              </Text>
            </View>
            <ActivityIndicator
              color={theme.colors.primary}
              style={styles.spinner}
            />
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text
          style={[styles.selectionInfo, { color: theme.colors.textSecondary }]}>
          {selectedVersions.length} version
          {selectedVersions.length !== 1 ? 's' : ''} selected
        </Text>
        <TouchableOpacity
          style={[
            styles.importButton,
            {
              backgroundColor:
                selectedVersions.length > 0
                  ? theme.colors.primary
                  : theme.colors.interactiveDisabled,
            },
          ]}
          onPress={handleImport}
          disabled={selectedVersions.length === 0 || isImporting}>
          <Text
            style={[
              styles.importButtonText,
              { color: theme.colors.textInverse },
            ]}>
            {isImporting ? 'Importing...' : 'Import Selected'}
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
  content: {
    flex: 1,
  },
  versionsContainer: {
    padding: 20,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  versionInfo: {
    flex: 1,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  versionName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  versionLanguage: {
    fontSize: 14,
    marginBottom: 2,
  },
  versionSize: {
    fontSize: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    paddingTop: 10,
  },
  selectionInfo: {
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  importButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  importOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  importModal: {
    padding: 24,
    borderRadius: 16,
    margin: 20,
    alignItems: 'center',
    minWidth: 280,
  },
  importTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
  },
  spinner: {
    marginTop: 10,
  },
});
