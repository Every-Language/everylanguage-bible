import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/hooks/useThemeFromStore';
import { useUserVersions } from '../hooks/useUserVersions';
import { useLanguageSearch } from '../hooks/useLanguageSearch';
import type { AudioVersion, TextVersion } from '../types/entities';
import type { LanguageSearchResult } from '../services/fuzzySearchService';
import { fuzzySearchService } from '../services/fuzzySearchService';
import { logger } from '../../../shared/utils/logger';

export interface VersionSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  versionType: 'audio' | 'text';
  title?: string;
}

type ModalView = 'versions' | 'languageSearch' | 'versionSelection';

interface VersionItemProps {
  version: AudioVersion | TextVersion;
  isSelected?: boolean;
  isAlreadySaved?: boolean;
  onSelect: (version: AudioVersion | TextVersion) => void;
  onRemove?: (versionId: string) => void;
  showRemove?: boolean;
}

const VersionItem: React.FC<VersionItemProps> = ({
  version,
  isSelected = false,
  isAlreadySaved = false,
  onSelect,
  onRemove,
  showRemove = false,
}) => {
  const { theme } = useTheme();

  const handleRemove = useCallback(() => {
    if (onRemove) {
      Alert.alert(
        'Remove Version',
        `Are you sure you want to remove "${version.name}" from your saved versions?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => onRemove(version.id),
          },
        ]
      );
    }
  }, [version, onRemove]);

  const handlePress = useCallback(() => {
    if (!isAlreadySaved) {
      onSelect(version);
    }
  }, [version, onSelect, isAlreadySaved]);

  return (
    <TouchableOpacity
      style={[
        styles.versionItem,
        {
          backgroundColor: isSelected
            ? theme.colors.primary + '20'
            : isAlreadySaved
              ? theme.colors.surface + '80'
              : theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          opacity: isAlreadySaved ? 0.6 : 1,
        },
      ]}
      onPress={handlePress}
      disabled={isAlreadySaved}>
      <View style={styles.versionContent}>
        <View style={styles.versionInfo}>
          <Text style={[styles.versionName, { color: theme.colors.text }]}>
            {version.name}
          </Text>
          <Text
            style={[
              styles.versionLanguage,
              { color: theme.colors.textSecondary },
            ]}>
            {version.languageName || 'Unknown Language'}
          </Text>
        </View>

        <View style={styles.versionActions}>
          {isSelected && (
            <Ionicons
              name='checkmark-circle'
              size={20}
              color={theme.colors.primary}
              style={styles.selectedIcon}
            />
          )}
          {isAlreadySaved && (
            <Text
              style={[
                styles.alreadySavedText,
                { color: theme.colors.textSecondary },
              ]}>
              Already Saved
            </Text>
          )}
          {!isAlreadySaved && !isSelected && (
            <Text style={[styles.selectText, { color: theme.colors.primary }]}>
              Select
            </Text>
          )}
          {showRemove && onRemove && (
            <TouchableOpacity
              onPress={handleRemove}
              style={[
                styles.removeButton,
                { backgroundColor: theme.colors.error + '20' },
              ]}>
              <Ionicons
                name='trash-outline'
                size={16}
                color={theme.colors.error}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface SearchResultItemProps {
  result: LanguageSearchResult;
  onSelect: (result: LanguageSearchResult) => void;
  versionType: 'audio' | 'text';
  isAvailable: boolean;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  onSelect,
  versionType,
  isAvailable,
}) => {
  const { theme } = useTheme();

  const handlePress = useCallback(() => {
    if (isAvailable) {
      onSelect(result);
    }
  }, [result, onSelect, isAvailable]);

  const getVersionCount = () => {
    if (versionType === 'audio') {
      return result.audio_version_count || 0;
    } else {
      return result.text_version_count || 0;
    }
  };

  const versionCount = getVersionCount();
  const regionText =
    result.regions && Array.isArray(result.regions) && result.regions.length > 0
      ? result.regions[0].region_name
      : '';

  return (
    <TouchableOpacity
      style={[
        styles.searchResultItem,
        {
          backgroundColor: isAvailable
            ? theme.colors.surface
            : theme.colors.background,
          borderBottomColor: theme.colors.border,
        },
        !isAvailable && { opacity: 0.6 },
      ]}
      onPress={handlePress}
      disabled={!isAvailable}>
      <View style={styles.searchResultContent}>
        <View style={styles.searchResultInfo}>
          <Text
            style={[
              styles.searchResultName,
              {
                color: isAvailable
                  ? theme.colors.text
                  : theme.colors.textSecondary,
              },
            ]}>
            {result.alias_name}
          </Text>

          {result.alias_name !== result.entity_name && (
            <Text
              style={[
                styles.searchResultEntityName,
                { color: theme.colors.textSecondary },
              ]}>
              {result.entity_name}
            </Text>
          )}

          {regionText && (
            <Text
              style={[
                styles.searchResultRegion,
                { color: theme.colors.textSecondary },
              ]}>
              {regionText}
            </Text>
          )}
        </View>

        <View style={styles.searchResultActions}>
          <Text
            style={[
              styles.searchResultCount,
              {
                color: isAvailable
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
              },
            ]}>
            {versionCount} {versionType}
          </Text>
          {!isAvailable && (
            <Text
              style={[
                styles.notAvailableText,
                { color: theme.colors.textSecondary },
              ]}>
              Not available
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const VersionSelectionModal: React.FC<VersionSelectionModalProps> = ({
  visible,
  onClose,
  versionType,
  title,
}) => {
  const { theme } = useTheme();
  const [currentView, setCurrentView] = useState<ModalView>('versions');
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageSearchResult | null>(null);
  const [languageVersions, setLanguageVersions] = useState<
    (AudioVersion | TextVersion)[]
  >([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const {
    savedAudioVersions,
    savedTextVersions,
    currentAudioVersion,
    currentTextVersion,
    isLoading,
    error,
    setCurrentAudioVersion,
    setCurrentTextVersion,
    removeSavedVersion,
    clearError,
    isVersionSaved,
  } = useUserVersions();

  const {
    isSearching,
    availableResults,
    unavailableResults,
    error: searchError,
    searchAudioVersions,
    searchTextVersions,
    clearResults,
    clearError: clearSearchError,
  } = useLanguageSearch();

  const savedVersions =
    versionType === 'audio' ? savedAudioVersions : savedTextVersions;
  const currentVersion =
    versionType === 'audio' ? currentAudioVersion : currentTextVersion;

  const handleVersionSelect = useCallback(
    async (version: AudioVersion | TextVersion) => {
      try {
        if (versionType === 'audio') {
          await setCurrentAudioVersion(version as AudioVersion);
        } else {
          await setCurrentTextVersion(version as TextVersion);
        }
        onClose();
      } catch (error) {
        logger.error('Error selecting version:', error);
      }
    },
    [versionType, setCurrentAudioVersion, setCurrentTextVersion, onClose]
  );

  const handleRemoveVersion = useCallback(
    async (versionId: string) => {
      try {
        await removeSavedVersion(versionId, versionType);
      } catch (error) {
        logger.error('Error removing version:', error);
      }
    },
    [removeSavedVersion, versionType]
  );

  const handleAddNewVersion = useCallback(() => {
    setCurrentView('languageSearch');
  }, []);

  const handleLanguageSelect = useCallback(
    async (language: LanguageSearchResult) => {
      try {
        setIsLoadingVersions(true);
        setSelectedLanguage(language);

        // Convert and load versions
        const versions =
          fuzzySearchService.convertVersionsToInternalFormat(language);
        const availableVersions =
          versionType === 'audio' ? versions.audio : versions.text;
        setLanguageVersions(availableVersions);

        setCurrentView('versionSelection');
        logger.info(
          `Loaded ${availableVersions.length} ${versionType} versions for language ${language.entity_name}`
        );
      } catch (error) {
        logger.error('Error loading versions:', error);
        Alert.alert(
          'Error',
          `Failed to load ${versionType} versions. Please try again.`
        );
      } finally {
        setIsLoadingVersions(false);
      }
    },
    [versionType]
  );

  const handleVersionFromLanguageSelect = useCallback(
    async (version: AudioVersion | TextVersion) => {
      try {
        // This will automatically save the version and set it as current
        if (versionType === 'audio') {
          await setCurrentAudioVersion(version as AudioVersion);
        } else {
          await setCurrentTextVersion(version as TextVersion);
        }

        // Close modal
        onClose();
      } catch (error) {
        logger.error('Error selecting version from language:', error);
      }
    },
    [versionType, setCurrentAudioVersion, setCurrentTextVersion, onClose]
  );

  const handleBackToVersions = useCallback(() => {
    setCurrentView('versions');
    setSearchQuery('');
    setHasSearched(false);
    clearResults();
    clearSearchError();
  }, [clearResults, clearSearchError]);

  const handleBackToLanguageSearch = useCallback(() => {
    setCurrentView('languageSearch');
    setSelectedLanguage(null);
    setLanguageVersions([]);
  }, []);

  const handleSearch = useCallback(() => {
    if (searchQuery.length < 2) {
      clearResults();
      setHasSearched(false);
      return;
    }

    setHasSearched(true);

    if (versionType === 'audio') {
      return searchAudioVersions(searchQuery);
    } else {
      return searchTextVersions(searchQuery);
    }
  }, [
    searchQuery,
    versionType,
    searchAudioVersions,
    searchTextVersions,
    clearResults,
  ]);

  const handleLanguageSearchSelect = useCallback(
    async (result: LanguageSearchResult) => {
      try {
        // Check that this language actually has versions available
        const versionCount =
          versionType === 'audio'
            ? result.audio_version_count || 0
            : result.text_version_count || 0;

        if (versionCount === 0) {
          Alert.alert(
            'No Versions Available',
            `This language doesn't have any ${versionType} versions available.`
          );
          return;
        }

        await handleLanguageSelect(result);
      } catch (error) {
        logger.error('Error selecting language:', error);
        Alert.alert('Error', 'Failed to select language. Please try again.');
      }
    },
    [versionType, handleLanguageSelect]
  );

  const handleCloseModal = useCallback(() => {
    // Reset all state
    setCurrentView('versions');
    setSelectedLanguage(null);
    setLanguageVersions([]);
    setSearchQuery('');
    setHasSearched(false);
    clearResults();
    clearError();
    clearSearchError();
    onClose();
  }, [clearResults, clearError, clearSearchError, onClose]);

  const renderHeader = () => {
    let headerTitle = title || `Select ${versionType} version`;
    let showBackButton = false;
    let backAction = handleBackToVersions;

    if (currentView === 'languageSearch') {
      headerTitle = `Search ${versionType} versions`;
      showBackButton = true;
      backAction = handleBackToVersions;
    } else if (currentView === 'versionSelection') {
      headerTitle = `${versionType} versions`;
      showBackButton = true;
      backAction = handleBackToLanguageSearch;
    }

    return (
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        {showBackButton ? (
          <TouchableOpacity onPress={backAction} style={styles.backButton}>
            <Ionicons
              name='arrow-back'
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        <Text style={[styles.title, { color: theme.colors.text }]}>
          {headerTitle}
        </Text>

        <TouchableOpacity onPress={handleCloseModal}>
          <Text style={[styles.doneButton, { color: theme.colors.primary }]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderVersionsView = () => (
    <>
      {/* Error Message */}
      {error && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: theme.colors.error + '20' },
          ]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading your saved versions...
          </Text>
        </View>
      ) : (
        <>
          {/* Add New Version Button */}
          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleAddNewVersion}>
              <Ionicons name='add' size={20} color='white' />
              <Text style={[styles.addButtonText, { color: 'white' }]}>
                Add new {versionType} version
              </Text>
            </TouchableOpacity>
          </View>

          {/* Saved Versions List */}
          <ScrollView style={styles.scrollView}>
            {savedVersions.length > 0 ? (
              <>
                <View
                  style={[
                    styles.sectionHeader,
                    { backgroundColor: theme.colors.surface },
                  ]}>
                  <Text
                    style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Your saved {versionType} versions ({savedVersions.length})
                  </Text>
                </View>

                {savedVersions.map(version => (
                  <VersionItem
                    key={version.id}
                    version={version}
                    isSelected={currentVersion?.id === version.id}
                    onSelect={handleVersionSelect}
                    onRemove={handleRemoveVersion}
                    showRemove={true}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}>
                  No saved {versionType} versions.{'\n'}
                  Add one to get started.
                </Text>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </>
  );

  const renderLanguageSearchView = () => (
    <>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
            },
          ]}
          placeholder={`Search for ${versionType} versions...`}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize='none'
          autoCorrect={false}
          returnKeyType='search'
          onSubmitEditing={handleSearch}
        />
      </View>

      {/* Error Message */}
      {searchError && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: theme.colors.error + '20' },
          ]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {searchError}
          </Text>
        </View>
      )}

      {/* Loading */}
      {isSearching && (
        <View style={styles.searchLoadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Searching...
          </Text>
        </View>
      )}

      {/* Results */}
      <ScrollView style={styles.scrollView}>
        {hasSearched && !isSearching && (
          <>
            {/* Available Results */}
            {availableResults.length > 0 && (
              <View>
                <View
                  style={[
                    styles.sectionHeader,
                    { backgroundColor: theme.colors.surface },
                  ]}>
                  <Text
                    style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Available ({availableResults.length})
                  </Text>
                </View>
                {availableResults.map((result: LanguageSearchResult) => (
                  <SearchResultItem
                    key={result.entity_id}
                    result={result}
                    onSelect={handleLanguageSearchSelect}
                    versionType={versionType}
                    isAvailable={true}
                  />
                ))}
              </View>
            )}

            {/* Unavailable Results */}
            {unavailableResults.length > 0 && (
              <View>
                <View
                  style={[
                    styles.sectionHeader,
                    { backgroundColor: theme.colors.surface },
                  ]}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.textSecondary },
                    ]}>
                    Not Available ({unavailableResults.length})
                  </Text>
                </View>
                {unavailableResults.map((result: LanguageSearchResult) => (
                  <SearchResultItem
                    key={result.entity_id}
                    result={result}
                    onSelect={handleLanguageSearchSelect}
                    versionType={versionType}
                    isAvailable={false}
                  />
                ))}
              </View>
            )}

            {/* No Results */}
            {availableResults.length === 0 &&
              unavailableResults.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.colors.textSecondary },
                    ]}>
                    {`No languages found for "${searchQuery}".\nTry a different search term.`}
                  </Text>
                </View>
              )}
          </>
        )}

        {/* Initial State */}
        {!hasSearched && searchQuery.length < 2 && (
          <View style={styles.emptyContainer}>
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Type at least 2 characters to search for languages.
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );

  const renderVersionSelectionView = () => (
    <>
      {/* Language Info */}
      {selectedLanguage && (
        <View
          style={[
            styles.languageInfo,
            { backgroundColor: theme.colors.surface },
          ]}>
          <Text style={[styles.languageInfoName, { color: theme.colors.text }]}>
            {selectedLanguage.alias_name}
          </Text>
          {selectedLanguage.alias_name !== selectedLanguage.entity_name && (
            <Text
              style={[
                styles.languageInfoEntity,
                { color: theme.colors.textSecondary },
              ]}>
              {selectedLanguage.entity_name}
            </Text>
          )}
        </View>
      )}

      {/* Loading */}
      {isLoadingVersions && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading {versionType} versions...
          </Text>
        </View>
      )}

      {/* Versions List */}
      <ScrollView style={styles.scrollView}>
        {!isLoadingVersions && languageVersions.length > 0 && (
          <>
            <View
              style={[
                styles.sectionHeader,
                { backgroundColor: theme.colors.surface },
              ]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Available {versionType} versions ({languageVersions.length})
              </Text>
            </View>

            {languageVersions.map(version => {
              const alreadySaved = isVersionSaved(version.id, versionType);
              return (
                <VersionItem
                  key={version.id}
                  version={version}
                  onSelect={handleVersionFromLanguageSelect}
                  isAlreadySaved={alreadySaved}
                />
              );
            })}
          </>
        )}

        {/* No Versions Message */}
        {!isLoadingVersions && languageVersions.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No {versionType} versions available for this language.
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );

  // Use handleSearch when searchQuery changes
  React.useEffect(() => {
    if (currentView === 'languageSearch') {
      const cleanup = handleSearch();
      return cleanup || (() => {});
    }
  }, [handleSearch, currentView]);

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={handleCloseModal}>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}>
        {renderHeader()}

        {currentView === 'versions' && renderVersionsView()}
        {currentView === 'languageSearch' && renderLanguageSearchView()}
        {currentView === 'versionSelection' && renderVersionSelectionView()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  searchLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  addButtonContainer: {
    padding: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionItem: {
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  versionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  versionInfo: {
    flex: 1,
  },
  versionName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  versionLanguage: {
    fontSize: 14,
  },
  versionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    marginRight: 8,
  },
  alreadySavedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchResultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  searchResultEntityName: {
    fontSize: 14,
    marginBottom: 4,
  },
  searchResultRegion: {
    fontSize: 12,
  },
  searchResultActions: {
    alignItems: 'flex-end',
  },
  searchResultCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  notAvailableText: {
    fontSize: 12,
    marginTop: 2,
  },
  languageInfo: {
    padding: 16,
  },
  languageInfoName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageInfoEntity: {
    fontSize: 14,
    marginTop: 2,
  },
});
