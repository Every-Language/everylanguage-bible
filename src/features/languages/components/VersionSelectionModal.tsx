import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { SlideUpModal } from '@/shared/components/ui/SlideUpModal';
import { Button } from '@/shared/components/ui/Button';
import {
  VersionSelectionModalProps,
  VersionListItemProps,
  AudioVersion,
  TextVersion,
} from '../types';
import { LanguageHierarchyBrowser } from './LanguageHierarchyBrowser';

// Individual Version List Item Component
const VersionListItem: React.FC<VersionListItemProps> = ({
  version,
  isSelected,
  onSelect,
  onRemove,
  showRemoveButton = false,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.versionItem,
        {
          backgroundColor: isSelected
            ? theme.colors.surfaceVariant
            : theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={() => onSelect(version)}
      activeOpacity={0.7}>
      <View style={styles.versionContent}>
        <View style={styles.versionInfo}>
          <Text
            style={[
              styles.versionName,
              {
                color: theme.colors.text,
                fontWeight: isSelected ? '600' : '500',
              },
            ]}
            numberOfLines={2}>
            {version.name}
          </Text>

          <Text
            style={[styles.languageName, { color: theme.colors.textSecondary }]}
            numberOfLines={1}>
            {version.languageName}
          </Text>

          <View style={styles.versionMeta}>
            {'mediaFileCount' in version ? (
              <Text
                style={[
                  styles.metaText,
                  { color: theme.colors.textSecondary },
                ]}>
                {version.mediaFileCount} audio files
              </Text>
            ) : (
              <Text
                style={[
                  styles.metaText,
                  { color: theme.colors.textSecondary },
                ]}>
                {version.verseCount} verses • {version.source}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.versionActions}>
          {isSelected && (
            <View
              style={[
                styles.selectedIndicator,
                { backgroundColor: theme.colors.primary },
              ]}>
              <Ionicons
                name='checkmark'
                size={16}
                color={theme.colors.textInverse}
              />
            </View>
          )}

          {showRemoveButton && onRemove && (
            <TouchableOpacity
              style={[
                styles.removeButton,
                { backgroundColor: theme.colors.error },
              ]}
              onPress={() => onRemove(version.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons
                name='trash'
                size={14}
                color={theme.colors.textInverse}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Main VersionSelectionModal Component
export const VersionSelectionModal: React.FC<VersionSelectionModalProps> = ({
  visible,
  onClose,
  onVersionSelect,
  versionType,
  currentVersion,
  savedVersions,
  title,
}) => {
  const { theme } = useTheme();
  const [showLanguageBrowser, setShowLanguageBrowser] = useState(false);
  const [isLoading] = useState(false);

  const handleVersionSelect = useCallback(
    (version: AudioVersion | TextVersion) => {
      onVersionSelect(version);
      onClose();
    },
    [onVersionSelect, onClose]
  );

  const handleAddNewVersion = useCallback(() => {
    setShowLanguageBrowser(true);
  }, []);

  const handleLanguageBrowserClose = useCallback(() => {
    setShowLanguageBrowser(false);
  }, []);

  const handleLanguageSelect = useCallback((_language: any) => {
    // This would navigate to available versions for the selected language
    // For now, we'll just close the browser
    setShowLanguageBrowser(false);
  }, []);

  const handleVersionAdd = useCallback(
    (version: AudioVersion | TextVersion, _type: 'audio' | 'text') => {
      // This would add the version to saved versions and then select it
      onVersionSelect(version);
      setShowLanguageBrowser(false);
      onClose();
    },
    [onVersionSelect, onClose]
  );

  const handleRemoveVersion = useCallback((versionId: string) => {
    // TODO: Implement remove version functionality
    console.log('Remove version:', versionId);
  }, []);

  const renderCurrentVersion = () => {
    if (!currentVersion) {
      return (
        <View
          style={[
            styles.currentVersionContainer,
            { backgroundColor: theme.colors.surface },
          ]}>
          <Text
            style={[
              styles.currentVersionLabel,
              { color: theme.colors.textSecondary },
            ]}>
            Current {versionType} version
          </Text>
          <Text
            style={[
              styles.noVersionText,
              { color: theme.colors.textSecondary },
            ]}>
            No {versionType} version selected
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.currentVersionContainer,
          { backgroundColor: theme.colors.surface },
        ]}>
        <Text
          style={[
            styles.currentVersionLabel,
            { color: theme.colors.textSecondary },
          ]}>
          Current {versionType} version
        </Text>

        <View style={styles.currentVersionInfo}>
          <View style={styles.currentVersionIcon}>
            <Ionicons
              name={versionType === 'audio' ? 'volume-high' : 'book'}
              size={20}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.currentVersionText}>
            <Text
              style={[styles.currentVersionName, { color: theme.colors.text }]}
              numberOfLines={1}>
              {currentVersion.name}
            </Text>
            <Text
              style={[
                styles.currentVersionLanguage,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={1}>
              {currentVersion.languageName}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSavedVersions = () => {
    if (savedVersions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name={
              versionType === 'audio' ? 'volume-high-outline' : 'book-outline'
            }
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
            No saved {versionType} versions
          </Text>
          <Text
            style={[
              styles.emptyStateMessage,
              { color: theme.colors.textSecondary },
            ]}>
            Add your first {versionType} version to get started
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.versionsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Saved {versionType} versions ({savedVersions.length})
        </Text>

        <View style={styles.versionsList}>
          {savedVersions.map(version => (
            <VersionListItem
              key={version.id}
              version={version}
              isSelected={currentVersion?.id === version.id}
              onSelect={handleVersionSelect}
              onRemove={handleRemoveVersion}
              showRemoveButton={true}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.primary} size='large' />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      );
    }

    return (
      <>
        {renderCurrentVersion()}
        {renderSavedVersions()}

        {/* Footer Button */}
        <View style={styles.footer}>
          <Button
            title={`Add New ${versionType === 'audio' ? 'Audio' : 'Text'} Version`}
            onPress={handleAddNewVersion}
            variant='primary'
            fullWidth
            disabled={isLoading}
          />
        </View>
      </>
    );
  };

  // Fixed Header Component
  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name='close' size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <SlideUpModal
        visible={visible && !showLanguageBrowser}
        onClose={onClose}
        header={renderHeader()}
        snapPoints={['70%']}>
        {renderContent()}
      </SlideUpModal>

      {/* Language Browser Modal */}
      <LanguageHierarchyBrowser
        visible={showLanguageBrowser}
        onClose={handleLanguageBrowserClose}
        onLanguageSelect={handleLanguageSelect}
        onVersionSelect={handleVersionAdd}
        mode='browse'
        title={`Add ${versionType === 'audio' ? 'Audio' : 'Text'} Version`}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  currentVersionContainer: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  currentVersionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  currentVersionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentVersionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  currentVersionText: {
    flex: 1,
  },
  currentVersionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentVersionLanguage: {
    fontSize: 14,
  },
  noVersionText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  versionsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  versionsList: {
    gap: 8,
  },
  versionItem: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  versionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  versionInfo: {
    flex: 1,
    marginRight: 12,
  },
  versionName: {
    fontSize: 16,
    marginBottom: 4,
  },
  languageName: {
    fontSize: 14,
    marginBottom: 4,
  },
  versionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
  },
  versionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
    minHeight: 200,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    minHeight: 200,
  },
  loadingText: {
    fontSize: 14,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
  },
});
