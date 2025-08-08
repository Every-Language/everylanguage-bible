import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../../shared/hooks/useThemeFromStore';
import { useLanguageSearch } from '../hooks/useLanguageSearch';
import { LanguageSearchResult } from '../services/fuzzySearchService';
import { logger } from '../../../shared/utils/logger';

export interface LanguageSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onLanguageSelect: (language: LanguageSearchResult) => void;
  versionType: 'audio' | 'text';
  title?: string;
}

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
        {
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: isAvailable
            ? theme.colors.surface
            : theme.colors.background,
        },
        !isAvailable && { opacity: 0.6 },
      ]}
      onPress={handlePress}
      disabled={!isAvailable}>
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
              color: isAvailable
                ? theme.colors.text
                : theme.colors.textSecondary,
              marginBottom: 4,
            }}>
            {result.alias_name}
          </Text>

          {result.alias_name !== result.entity_name && (
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.textSecondary,
                marginBottom: 4,
              }}>
              {result.entity_name}
            </Text>
          )}

          {regionText && (
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.textSecondary,
              }}>
              {regionText}
            </Text>
          )}
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 14,
              color: isAvailable
                ? theme.colors.primary
                : theme.colors.textSecondary,
              fontWeight: '500',
            }}>
            {versionCount} {versionType}
          </Text>
          {!isAvailable && (
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.textSecondary,
                marginTop: 2,
              }}>
              Not available
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const LanguageSearchModal: React.FC<LanguageSearchModalProps> = ({
  visible,
  onClose,
  onLanguageSelect,
  versionType,
  title,
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const {
    isSearching,
    availableResults,
    unavailableResults,
    error,
    searchAudioVersions,
    searchTextVersions,
    clearResults,
    clearError,
  } = useLanguageSearch();

  const handleSearch = useCallback(() => {
    if (searchQuery.length < 2) {
      clearResults();
      setHasSearched(false);
      return;
    }

    setHasSearched(true);

    // The new search service handles debouncing internally
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

  useEffect(() => {
    // The search service handles debouncing internally, so we can call it directly
    const cleanup = handleSearch();

    // Return cleanup function if one was provided
    return cleanup || (() => {});
  }, [handleSearch]);

  // Cleanup is handled by the language search service

  const handleLanguageSelect = useCallback(
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

        onLanguageSelect(result);
      } catch (error) {
        logger.error('Error selecting language:', error);
        Alert.alert('Error', 'Failed to select language. Please try again.');
      }
    },
    [versionType, onLanguageSelect]
  );

  const handleClose = useCallback(() => {
    setSearchQuery('');
    clearResults();
    clearError();
    setHasSearched(false);
    onClose();
  }, [onClose, clearResults, clearError]);

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
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text,
            }}>
            {title || `Search ${versionType} versions`}
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={{ fontSize: 16, color: theme.colors.primary }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={{ padding: 16 }}>
          <TextInput
            style={{
              height: 44,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              fontSize: 16,
            }}
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
        {error && (
          <View
            style={{ padding: 16, backgroundColor: theme.colors.error + '20' }}>
            <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
              {error}
            </Text>
          </View>
        )}

        {/* Loading */}
        {isSearching && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size='large' color={theme.colors.primary} />
            <Text style={{ marginTop: 8, color: theme.colors.textSecondary }}>
              Searching...
            </Text>
          </View>
        )}

        {/* Results */}
        <ScrollView style={{ flex: 1 }}>
          {hasSearched && !isSearching && (
            <>
              {/* Available Results */}
              {availableResults.length > 0 && (
                <View>
                  <View
                    style={{
                      padding: 16,
                      backgroundColor: theme.colors.surface,
                    }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                      }}>
                      Available ({availableResults.length})
                    </Text>
                  </View>
                  {availableResults.map((result: LanguageSearchResult) => (
                    <SearchResultItem
                      key={result.entity_id}
                      result={result}
                      onSelect={handleLanguageSelect}
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
                    style={{
                      padding: 16,
                      backgroundColor: theme.colors.surface,
                    }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.textSecondary,
                      }}>
                      Not Available ({unavailableResults.length})
                    </Text>
                  </View>
                  {unavailableResults.map((result: LanguageSearchResult) => (
                    <SearchResultItem
                      key={result.entity_id}
                      result={result}
                      onSelect={handleLanguageSelect}
                      versionType={versionType}
                      isAvailable={false}
                    />
                  ))}
                </View>
              )}

              {/* No Results */}
              {availableResults.length === 0 &&
                unavailableResults.length === 0 && (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        textAlign: 'center',
                      }}>
                      {`No languages found for "${searchQuery}".\nTry a different search term.`}
                    </Text>
                  </View>
                )}
            </>
          )}

          {/* Initial State */}
          {!hasSearched && searchQuery.length < 2 && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                }}>
                Type at least 2 characters to search for languages.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
