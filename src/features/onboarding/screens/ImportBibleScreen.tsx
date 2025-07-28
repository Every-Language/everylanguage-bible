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
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { onboardingSyncService } from '../services/OnboardingSyncService';
import type { OnboardingSyncProgress } from '../services/OnboardingSyncService';
import { logger } from '@/shared/utils/logger';

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

const getCheckboxStyle = (theme: any, isSelected: boolean) => ({
  backgroundColor: isSelected ? theme.colors.primary : 'transparent',
  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
});

export const ImportBibleScreen: React.FC<ImportBibleScreenProps> = ({
  onBack,
  onComplete,
}) => {
  const { theme } = useTheme();
  const [versions] = useState<BibleVersion[]>(sampleBibleVersions);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [syncProgress, setSyncProgress] =
    useState<OnboardingSyncProgress | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleVersionToggle = (versionId: string) => {
    setSelectedVersions(prev =>
      prev.includes(versionId)
        ? prev.filter(id => id !== versionId)
        : [...prev, versionId]
    );
  };

  const handleImport = async () => {
    if (selectedVersions.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    setSyncError(null);

    try {
      // Set up progress callback
      onboardingSyncService.setProgressCallback(
        (progress: OnboardingSyncProgress) => {
          setSyncProgress(progress);
          setImportProgress(progress.progress);
        }
      );

      // Perform optimized onboarding sync
      const result = await onboardingSyncService.performOnboardingSync();

      if (result.success) {
        logger.info(
          `Onboarding sync completed successfully in ${result.duration}ms`
        );
        onComplete();
      } else {
        logger.error('Onboarding sync failed:', result.errors);
        setSyncError(result.errors.join(', '));
        // Still complete onboarding even with errors
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error) {
      logger.error('Import failed:', error);
      setSyncError(error instanceof Error ? error.message : 'Import failed');
      // Still complete onboarding even with errors
      setTimeout(() => {
        onComplete();
      }, 2000);
    } finally {
      setIsImporting(false);
      onboardingSyncService.setProgressCallback(null);
    }
  };

  const renderBibleVersion = (version: BibleVersion) => {
    const isSelected = selectedVersions.includes(version.id);
    return (
      <TouchableOpacity
        key={version.id}
        style={[
          styles.versionItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isSelected
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
        <View style={[styles.checkbox, getCheckboxStyle(theme, isSelected)]}>
          {isSelected && (
            <Text
              style={[styles.checkmark, { color: theme.colors.textInverse }]}>
              ✓
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getProgressMessage = () => {
    if (syncProgress) {
      return syncProgress.message;
    }
    return 'Preparing Bible content...';
  };

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
          Import Bible Content
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Select Bible versions to import and store locally
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bible Version Selection */}
        {!isImporting && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Available Bible Versions
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                { color: theme.colors.textSecondary },
              ]}>
              Select the versions you want to download for offline use
            </Text>
            {versions.map(renderBibleVersion)}
          </>
        )}

        {/* Import Progress */}
        {isImporting && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size='large' color={theme.colors.primary} />
            <Text style={[styles.progressText, { color: theme.colors.text }]}>
              {getProgressMessage()}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${importProgress}%`,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressPercentage,
                { color: theme.colors.textSecondary },
              ]}>
              {importProgress}%
            </Text>
            {syncProgress?.recordsSynced !== undefined && (
              <Text
                style={[
                  styles.recordsSynced,
                  { color: theme.colors.textSecondary },
                ]}>
                Synced {syncProgress.recordsSynced.toLocaleString()} records
              </Text>
            )}
            {syncError && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {syncError}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.importButton,
            {
              backgroundColor:
                selectedVersions.length > 0 && !isImporting
                  ? theme.colors.primary
                  : theme.colors.border,
            },
          ]}
          onPress={handleImport}
          disabled={selectedVersions.length === 0 || isImporting}>
          {isImporting ? (
            <ActivityIndicator size='small' color={theme.colors.textInverse} />
          ) : (
            <Text
              style={[
                styles.importButtonText,
                { color: theme.colors.textInverse },
              ]}>
              Import Selected ({selectedVersions.length})
            </Text>
          )}
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
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
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
    paddingVertical: 4,
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
  progressContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: 8,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    marginBottom: 8,
  },
  recordsSynced: {
    fontSize: 14,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#ff4444',
  },
  footer: {
    padding: 20,
    paddingTop: 10,
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
});
