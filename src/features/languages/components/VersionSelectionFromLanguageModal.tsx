import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../../shared/hooks/useThemeFromStore';
import { useUserVersions } from '../hooks/useUserVersions';
import {
  LanguageSearchResult,
  fuzzySearchService,
} from '../services/fuzzySearchService';
import { AudioVersion, TextVersion } from '../types/entities';
import { logger } from '../../../shared/utils/logger';

export interface VersionSelectionFromLanguageModalProps {
  visible: boolean;
  onClose: () => void;
  onVersionSelect: (version: any) => void;
  language: LanguageSearchResult | null;
  versionType: 'audio' | 'text';
  title?: string;
}

interface VersionItemProps {
  version: AudioVersion | TextVersion;
  onSelect: (version: AudioVersion | TextVersion) => void;
  versionType: 'audio' | 'text';
  isAlreadySaved: boolean;
}

const VersionItem: React.FC<VersionItemProps> = ({
  version,
  onSelect,
  versionType: _versionType,
  isAlreadySaved,
}) => {
  const { theme } = useTheme();

  const handlePress = useCallback(() => {
    if (!isAlreadySaved) {
      onSelect(version);
    }
  }, [version, onSelect, isAlreadySaved]);

  return (
    <TouchableOpacity
      style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: isAlreadySaved
          ? theme.colors.surface + '80'
          : theme.colors.surface,
        opacity: isAlreadySaved ? 0.6 : 1,
      }}
      onPress={handlePress}
      disabled={isAlreadySaved}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: theme.colors.text,
              marginBottom: 4,
            }}>
            {version.name}
          </Text>

          {version.languageEntityId && (
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.textSecondary,
                marginBottom: 4,
              }}>
              ID: {version.id}
            </Text>
          )}

          <Text
            style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
            }}>
            Created: {new Date(version.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 14,
              color: isAlreadySaved
                ? theme.colors.textSecondary
                : theme.colors.primary,
              fontWeight: '500',
            }}>
            {isAlreadySaved ? 'Already Saved' : 'Select'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const VersionSelectionFromLanguageModal: React.FC<
  VersionSelectionFromLanguageModalProps
> = ({ visible, onClose, onVersionSelect, language, versionType, title }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState<(AudioVersion | TextVersion)[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { isVersionSaved } = useUserVersions();

  const loadVersions = useCallback(async () => {
    if (!language) return;

    try {
      setIsLoading(true);
      setError(null);

      // Use the version details directly from the language search result
      const versions =
        fuzzySearchService.convertVersionsToInternalFormat(language);
      const availableVersions =
        versionType === 'audio' ? versions.audio : versions.text;
      setVersions(availableVersions);

      if (availableVersions.length === 0) {
        setError(`No ${versionType} versions available for this language.`);
      }

      logger.info(
        `Loaded ${availableVersions.length} ${versionType} versions for language ${language.entity_name}`
      );
    } catch (error) {
      logger.error('Error loading versions:', error);
      setError(`Failed to load ${versionType} versions. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }, [language, versionType]);

  useEffect(() => {
    if (visible && language) {
      loadVersions();
    }
  }, [visible, language, loadVersions]);

  const handleVersionSelect = useCallback(
    async (version: any) => {
      try {
        onVersionSelect(version);
        onClose();
      } catch (error) {
        logger.error('Error selecting version:', error);
        Alert.alert('Error', 'Failed to select version. Please try again.');
      }
    },
    [onVersionSelect, onClose]
  );

  const handleClose = useCallback(() => {
    setVersions([]);
    setError(null);
    onClose();
  }, [onClose]);

  const handleBackToSearch = useCallback(() => {
    handleClose();
  }, [handleClose]);

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}>
          <TouchableOpacity onPress={handleBackToSearch}>
            <Text style={{ fontSize: 16, color: theme.colors.primary }}>
              ← Back
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text,
              flex: 1,
              textAlign: 'center',
            }}>
            {title || `${versionType} versions`}
          </Text>

          <TouchableOpacity onPress={handleClose}>
            <Text style={{ fontSize: 16, color: theme.colors.primary }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {/* Language Info */}
        {language && (
          <View style={{ padding: 16, backgroundColor: theme.colors.surface }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: theme.colors.text,
              }}>
              {language.alias_name}
            </Text>
            {language.alias_name !== language.entity_name && (
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                  marginTop: 2,
                }}>
                {language.entity_name}
              </Text>
            )}
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View
            style={{ padding: 16, backgroundColor: theme.colors.error + '20' }}>
            <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
              {error}
            </Text>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size='large' color={theme.colors.primary} />
            <Text style={{ marginTop: 8, color: theme.colors.textSecondary }}>
              Loading {versionType} versions...
            </Text>
          </View>
        )}

        {/* Versions List */}
        <ScrollView style={{ flex: 1 }}>
          {!isLoading && versions.length > 0 && (
            <>
              <View
                style={{ padding: 16, backgroundColor: theme.colors.surface }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text,
                  }}>
                  Available {versionType} versions ({versions.length})
                </Text>
              </View>

              {versions.map(version => {
                const alreadySaved = isVersionSaved(version.id, versionType);
                return (
                  <VersionItem
                    key={version.id}
                    version={version}
                    onSelect={handleVersionSelect}
                    versionType={versionType}
                    isAlreadySaved={alreadySaved}
                  />
                );
              })}
            </>
          )}

          {/* No Versions Message */}
          {!isLoading && versions.length === 0 && !error && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                }}>
                No {versionType} versions available for this language.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
