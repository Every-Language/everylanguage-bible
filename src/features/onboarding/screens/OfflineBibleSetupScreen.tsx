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
import { useTheme } from '@/shared/hooks';
import { logger } from '@/shared/utils/logger';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';

interface OfflineBibleSetupScreenProps {
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

const getCheckboxStyle = (
  theme: { colors: { primary: string; border: string } },
  isSelected: boolean
) => ({
  width: 24,
  height: 24,
  borderRadius: 4,
  borderWidth: 2,
  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
  backgroundColor: isSelected ? theme.colors.primary : 'transparent',
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
});

export const OfflineBibleSetupScreen: React.FC<
  OfflineBibleSetupScreenProps
> = ({ onBack, onComplete }) => {
  const { theme } = useTheme();
  const [versions, setVersions] = useState<BibleVersion[]>(sampleBibleVersions);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleVersionToggle = (versionId: string) => {
    setVersions(prevVersions =>
      prevVersions.map(version =>
        version.id === versionId
          ? { ...version, isSelected: !version.isSelected }
          : version
      )
    );
  };

  const handleImport = async () => {
    const selectedVersions = versions.filter(v => v.isSelected);
    if (selectedVersions.length === 0) {
      logger.debug('OfflineBibleSetupScreen: No versions selected for import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simulate import progress
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      logger.debug('OfflineBibleSetupScreen: Import completed successfully');
      onComplete();
    } catch (error) {
      logger.debug('OfflineBibleSetupScreen: Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const renderBibleVersion = (version: BibleVersion) => {
    const checkboxStyle = getCheckboxStyle(theme, version.isSelected);
    const totalSize = version.size;

    return (
      <TouchableOpacity
        key={version.id}
        style={[
          styles.versionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: version.isSelected
              ? theme.colors.primary
              : theme.colors.border,
          },
        ]}
        onPress={() => handleVersionToggle(version.id)}
        activeOpacity={0.7}>
        <View style={styles.versionHeader}>
          <View style={checkboxStyle}>
            {version.isSelected && (
              <MaterialIcons name='check' size={16} color='white' />
            )}
          </View>
          <View style={styles.versionInfo}>
            <Text style={[styles.versionName, { color: theme.colors.text }]}>
              {version.name}
            </Text>
            <Text
              style={[
                styles.versionLanguage,
                { color: theme.colors.textSecondary },
              ]}>
              {version.language}
            </Text>
          </View>
          <View style={styles.versionMeta}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor:
                    version.type === 'audio'
                      ? theme.colors.primary + '20'
                      : theme.colors.surfaceVariant,
                },
              ]}>
              <Text
                style={[
                  styles.typeText,
                  {
                    color:
                      version.type === 'audio'
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                  },
                ]}>
                {version.type.toUpperCase()}
              </Text>
            </View>
            <Text
              style={[styles.sizeText, { color: theme.colors.textSecondary }]}>
              {totalSize}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getProgressMessage = () => {
    if (importProgress === 0) return 'Preparing import...';
    if (importProgress < 50) return 'Downloading Bible content...';
    if (importProgress < 100) return 'Installing to device...';
    return 'Import completed!';
  };

  const selectedCount = versions.filter(v => v.isSelected).length;
  const totalSize = versions
    .filter(v => v.isSelected)
    .reduce((acc, v) => {
      const sizeInMB = parseFloat(v.size.replace(' MB', ''));
      return acc + sizeInMB;
    }, 0);

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
          Offline Bible Setup
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Download Bible content for offline use
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Import Progress */}
        {isImporting && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text
                style={[styles.progressTitle, { color: theme.colors.text }]}>
                Importing Bible Content
              </Text>
              <Text
                style={[
                  styles.progressMessage,
                  { color: theme.colors.textSecondary },
                ]}>
                {getProgressMessage()}
              </Text>
            </View>
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
                styles.progressText,
                { color: theme.colors.textSecondary },
              ]}>
              {importProgress}%
            </Text>
          </View>
        )}

        {/* Selection Summary */}
        {!isImporting && selectedCount > 0 && (
          <View
            style={[
              styles.summaryContainer,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}>
            <MaterialIcons
              name='info-outline'
              size={20}
              color={theme.colors.primary}
            />
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
                {selectedCount} version{selectedCount !== 1 ? 's' : ''} selected
              </Text>
              <Text
                style={[
                  styles.summarySize,
                  { color: theme.colors.textSecondary },
                ]}>
                Total size: {totalSize.toFixed(1)} MB
              </Text>
            </View>
          </View>
        )}

        {/* Bible Versions List */}
        <View style={styles.versionsContainer}>
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
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <MaterialIcons
            name='help-outline'
            size={16}
            color={theme.colors.textSecondary}
          />
          <Text
            style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            Downloaded content will be available offline. You can manage your
            downloads later in the app settings.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.importButton,
            {
              backgroundColor:
                selectedCount > 0 && !isImporting
                  ? theme.colors.primary
                  : theme.colors.interactiveDisabled,
            },
          ]}
          onPress={handleImport}
          disabled={selectedCount === 0 || isImporting}>
          {isImporting ? (
            <ActivityIndicator color={theme.colors.textInverse} size='small' />
          ) : (
            <MaterialIcons
              name='cloud-download'
              size={20}
              color={theme.colors.textInverse}
            />
          )}
          <Text
            style={[
              styles.importButtonText,
              { color: theme.colors.textInverse },
            ]}>
            {isImporting
              ? 'Importing...'
              : `Import ${selectedCount} Version${
                  selectedCount !== 1 ? 's' : ''
                }`}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  backIcon: {
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 10,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressContainer: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLOR_VARIATIONS.CREAM_LIGHT,
    shadowColor: COLOR_VARIATIONS.CHARCOAL_DARK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressMessage: {
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLOR_VARIATIONS.BLACK_10,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  summarySize: {
    fontSize: 14,
  },
  versionsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  versionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: COLOR_VARIATIONS.SHADOW_BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  versionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  versionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  versionLanguage: {
    fontSize: 14,
  },
  versionMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sizeText: {
    fontSize: 12,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 8,
    shadowColor: COLOR_VARIATIONS.SHADOW_BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  importButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
