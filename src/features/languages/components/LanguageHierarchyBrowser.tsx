import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { SlideUpModal } from '@/shared/components/ui/SlideUpModal';
import { Button } from '@/shared/components/ui/Button';
import {
  LanguageEntity,
  AudioVersion,
  TextVersion,
  LanguageHierarchyBrowserProps,
} from '../types';
import { useLanguageHierarchy } from '../hooks';
import { useLanguageSelection } from '../hooks/useLanguageSelection';

// Individual Language Node Component with proper expansion handling
interface LanguageNodeWrapperProps {
  node: any;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (language: LanguageEntity) => void;
  isNodeExpanded: (nodeId: string) => boolean;
  depth: number;
}

const LanguageNodeWrapper: React.FC<LanguageNodeWrapperProps> = ({
  node,
  onToggleExpand,
  onSelect,
  isNodeExpanded,
  depth,
}) => {
  const { theme } = useTheme();

  const paddingLeft = depth * 20 + 16;
  const hasChildren =
    node.hasChildren || (node.children && node.children.length > 0);
  const isExpanded = isNodeExpanded(node.id);

  // Check if this language has available content
  const hasAvailableContent = node.hasAvailableVersions || false;
  const isDisabled = !hasAvailableContent && !hasChildren;

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.nodeContainer,
          {
            paddingLeft,
            backgroundColor: theme.colors.background,
          },
          isDisabled && [
            styles.disabledNode,
            { backgroundColor: theme.colors.surfaceVariant },
          ],
        ]}
        onPress={() => !isDisabled && onSelect(node)}
        disabled={isDisabled}
        activeOpacity={isDisabled ? 1 : 0.7}>
        <View style={styles.nodeContent}>
          {hasChildren && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => onToggleExpand(node.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons
                name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          {!hasChildren && <View style={styles.expandButtonPlaceholder} />}

          <View style={styles.nodeInfo}>
            <Text
              style={[
                styles.nodeName,
                { color: theme.colors.text },
                isDisabled && [
                  styles.disabledText,
                  { color: theme.colors.textSecondary },
                ],
              ]}
              numberOfLines={2}>
              {node.name}
            </Text>

            <View style={styles.nodeMetadata}>
              <Text
                style={[
                  styles.nodeLevel,
                  { color: theme.colors.textSecondary },
                  isDisabled && [
                    styles.disabledText,
                    { color: theme.colors.textSecondary },
                  ],
                ]}>
                {node.level}
              </Text>

              {/* Show availability counts */}
              {node.availableVersionCounts && (
                <View style={styles.availabilityCounts}>
                  {node.availableVersionCounts.audio > 0 && (
                    <View style={styles.countBadge}>
                      <Ionicons
                        name='volume-high'
                        size={10}
                        color={theme.colors.success}
                      />
                      <Text
                        style={[
                          styles.countText,
                          { color: theme.colors.success },
                        ]}>
                        {node.availableVersionCounts.audio}
                      </Text>
                    </View>
                  )}

                  {node.availableVersionCounts.text > 0 && (
                    <View style={styles.countBadge}>
                      <Ionicons
                        name='document-text'
                        size={10}
                        color={theme.colors.info}
                      />
                      <Text
                        style={[
                          styles.countText,
                          { color: theme.colors.info },
                        ]}>
                        {node.availableVersionCounts.text}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Show "No content" for languages without content */}
              {!hasAvailableContent && !hasChildren && (
                <Text
                  style={[
                    styles.noContentLabel,
                    { color: theme.colors.textSecondary },
                  ]}>
                  No content available
                </Text>
              )}
            </View>
          </View>

          {hasAvailableContent && (
            <TouchableOpacity
              style={[
                styles.selectButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => onSelect(node)}>
              <Text
                style={[
                  styles.selectButtonText,
                  { color: theme.colors.textInverse },
                ]}>
                Select
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Render children if expanded - each child checks its own expansion state */}
      {hasChildren && isExpanded && node.children && (
        <View>
          {node.children.map((child: any) => (
            <LanguageNodeWrapper
              key={child.id}
              node={child}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              isNodeExpanded={isNodeExpanded}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Main LanguageHierarchyBrowser Component
export const LanguageHierarchyBrowser: React.FC<
  LanguageHierarchyBrowserProps
> = ({
  visible,
  onClose,
  onLanguageSelect,
  onVersionSelect,
  mode = 'browse',
  title = 'Select Language',
}) => {
  const { theme } = useTheme();
  const { addToSavedVersions } = useLanguageSelection();
  const {
    languageHierarchy,
    searchQuery,
    searchResults,
    isLoadingHierarchy,
    isSearching,
    error,
    loadLanguageHierarchy,
    toggleNodeExpansion,
    isNodeExpanded,
    searchLanguages,
    clearSearch,
    resetNavigation,
  } = useLanguageHierarchy();

  const [showingAvailableVersions, setShowingAvailableVersions] =
    useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageEntity | null>(null);
  const [availableVersions, setAvailableVersions] = useState<{
    audio: AudioVersion[];
    text: TextVersion[];
  }>({ audio: [], text: [] });
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Reset modal state when it opens
  useEffect(() => {
    if (visible) {
      // Reset all modal state when opening
      setShowingAvailableVersions(false);
      setSelectedLanguage(null);
      setAvailableVersions({ audio: [], text: [] });
      setLoadingVersions(false);

      // Reset language hierarchy navigation state
      resetNavigation();
      clearSearch();

      // Load hierarchy only if not already loaded or loading
      if (languageHierarchy.length === 0 && !isLoadingHierarchy) {
        loadLanguageHierarchy();
      }
    }
  }, [
    visible,
    languageHierarchy.length,
    isLoadingHierarchy,
    loadLanguageHierarchy,
    resetNavigation,
    clearSearch,
  ]);

  const handleLanguageSelect = useCallback(
    async (language: LanguageEntity) => {
      setSelectedLanguage(language);

      if (mode === 'browse') {
        // In browse mode, show available versions
        try {
          setLoadingVersions(true);

          // Call the actual service to get available versions
          const { languageService } = await import('../services');
          const versions = await languageService.getAvailableVersions(
            language.id
          );

          setAvailableVersions(versions);
          setShowingAvailableVersions(true);
        } catch (error) {
          console.error('Error loading available versions:', error);
          Alert.alert(
            'Error',
            'Failed to load available versions for this language'
          );
        } finally {
          setLoadingVersions(false);
        }
      } else {
        // In select mode, directly select the language
        onLanguageSelect(language);
        onClose();
      }
    },
    [mode, onLanguageSelect, onClose]
  );

  const handleVersionSelect = useCallback(
    async (version: AudioVersion | TextVersion, type: 'audio' | 'text') => {
      try {
        // First add the version to saved versions
        await addToSavedVersions(version, type);

        // Then call the parent's version select handler
        if (onVersionSelect) {
          onVersionSelect(version, type);
        }

        onClose();
      } catch (error) {
        console.error('Error adding version to saved list:', error);

        // Still proceed with selection even if saving fails
        if (onVersionSelect) {
          onVersionSelect(version, type);
        }
        onClose();
      }
    },
    [addToSavedVersions, onVersionSelect, onClose]
  );

  const handleBackToLanguages = useCallback(() => {
    setShowingAvailableVersions(false);
    setSelectedLanguage(null);
    setAvailableVersions({ audio: [], text: [] });
  }, []);

  const handleSearchChange = useCallback(
    (text: string) => {
      if (text.trim()) {
        searchLanguages(text);
      } else {
        clearSearch();
      }
    },
    [searchLanguages, clearSearch]
  );

  const renderSearchResults = () => {
    if (!searchQuery || searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text
            style={[
              styles.emptyStateText,
              { color: theme.colors.textSecondary },
            ]}>
            {searchQuery
              ? 'No languages found'
              : 'Start typing to search languages'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.searchResults}>
        {searchResults.map(language => (
          <TouchableOpacity
            key={language.id}
            style={[
              styles.searchResultItem,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => handleLanguageSelect(language)}>
            <View style={styles.searchResultContent}>
              <Text
                style={[styles.searchResultName, { color: theme.colors.text }]}>
                {language.name}
              </Text>
              <Text
                style={[
                  styles.searchResultLevel,
                  { color: theme.colors.textSecondary },
                ]}>
                {language.level}
              </Text>
            </View>
            <Ionicons
              name='chevron-forward'
              size={16}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderHierarchy = () => {
    if (isLoadingHierarchy) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading languages...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          <Button
            title='Retry'
            onPress={loadLanguageHierarchy}
            variant='outline'
            size='sm'
          />
        </View>
      );
    }

    if (languageHierarchy.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text
            style={[
              styles.emptyStateText,
              { color: theme.colors.textSecondary },
            ]}>
            No languages available
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.hierarchyContainer}>
        {languageHierarchy.map(node => (
          <LanguageNodeWrapper
            key={node.id}
            node={node}
            onToggleExpand={toggleNodeExpansion}
            onSelect={handleLanguageSelect}
            isNodeExpanded={isNodeExpanded}
            depth={0}
          />
        ))}
      </ScrollView>
    );
  };

  const hasAudioVersions = availableVersions.audio.length > 0;
  const hasTextVersions = availableVersions.text.length > 0;

  const renderAvailableVersions = () => (
    <ScrollView style={styles.versionsContainer}>
      {/* Selected Language Info */}
      <View
        style={[
          styles.selectedLanguageInfo,
          { backgroundColor: theme.colors.surface },
        ]}>
        <Text
          style={[styles.selectedLanguageName, { color: theme.colors.text }]}>
          {selectedLanguage?.name}
        </Text>
        <Text
          style={[
            styles.selectedLanguageLevel,
            { color: theme.colors.textSecondary },
          ]}>
          {selectedLanguage?.level}
        </Text>
      </View>

      {/* Audio Versions */}
      {hasAudioVersions && (
        <View style={styles.versionCategory}>
          <Text
            style={[styles.versionCategoryTitle, { color: theme.colors.text }]}>
            Audio Versions ({availableVersions.audio.length})
          </Text>
          {availableVersions.audio.map(version => (
            <TouchableOpacity
              key={version.id}
              style={[
                styles.versionItem,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={() => handleVersionSelect(version, 'audio')}>
              <View style={styles.versionInfo}>
                <Text
                  style={[styles.versionName, { color: theme.colors.text }]}>
                  {version.name}
                </Text>
                <Text
                  style={[
                    styles.versionMeta,
                    { color: theme.colors.textSecondary },
                  ]}>
                  {version.mediaFileCount} audio files
                </Text>
              </View>
              <Button
                title='Add'
                onPress={() => handleVersionSelect(version, 'audio')}
                size='sm'
                variant='primary'
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Text Versions */}
      {hasTextVersions && (
        <View style={styles.versionCategory}>
          <Text
            style={[styles.versionCategoryTitle, { color: theme.colors.text }]}>
            Text Versions ({availableVersions.text.length})
          </Text>
          {availableVersions.text.map(version => (
            <TouchableOpacity
              key={version.id}
              style={[
                styles.versionItem,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={() => handleVersionSelect(version, 'text')}>
              <View style={styles.versionInfo}>
                <Text
                  style={[styles.versionName, { color: theme.colors.text }]}>
                  {version.name}
                </Text>
                <Text
                  style={[
                    styles.versionMeta,
                    { color: theme.colors.textSecondary },
                  ]}>
                  {version.verseCount} verses • {version.source}
                </Text>
              </View>
              <Button
                title='Add'
                onPress={() => handleVersionSelect(version, 'text')}
                size='sm'
                variant='primary'
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* No Versions Available */}
      {!hasAudioVersions && !hasTextVersions && !loadingVersions && (
        <View style={styles.emptyState}>
          <Text
            style={[
              styles.emptyStateText,
              { color: theme.colors.textSecondary },
            ]}>
            No versions available for this language
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // Fixed Header Component
  const renderHeader = () => (
    <View style={styles.headerContent}>
      {showingAvailableVersions ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToLanguages}>
          <Ionicons
            name='chevron-back'
            size={20}
            color={theme.colors.primary}
          />
          <Text
            style={[styles.backButtonText, { color: theme.colors.primary }]}>
            Languages
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name='close' size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (showingAvailableVersions) {
      return renderAvailableVersions();
    }

    return (
      <>
        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.colors.surface },
          ]}>
          <Ionicons
            name='search'
            size={20}
            color={theme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
              },
            ]}
            placeholder='Search languages...'
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize='none'
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSearchChange('')}>
              <Ionicons
                name='close-circle'
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
          {isSearching && (
            <ActivityIndicator
              color={theme.colors.primary}
              size='small'
              style={styles.searchLoading}
            />
          )}
        </View>

        {/* Search Results or Hierarchy */}
        {searchQuery ? renderSearchResults() : renderHierarchy()}
      </>
    );
  };

  return (
    <SlideUpModal
      visible={visible}
      onClose={onClose}
      header={renderHeader()}
      snapPoints={['70%']}>
      {renderContent()}
    </SlideUpModal>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  searchIcon: {
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchLoading: {
    marginLeft: 8,
  },
  hierarchyContainer: {
    flex: 1,
  },
  nodeContainer: {
    paddingVertical: 12,
    paddingRight: 16,
  },
  nodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonPlaceholder: {
    width: 24,
    height: 24,
  },
  nodeInfo: {
    flex: 1,
  },
  nodeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  nodeLevel: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  searchResultLevel: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  versionsContainer: {
    flex: 1,
    paddingTop: 16,
  },
  selectedLanguageInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedLanguageName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedLanguageLevel: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  versionCategory: {
    marginBottom: 24,
  },
  versionCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  versionInfo: {
    flex: 1,
    marginRight: 12,
  },
  versionName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  versionMeta: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    minHeight: 200,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
    minHeight: 200,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  disabledNode: {
    opacity: 0.6,
  },
  nodeMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  availabilityCounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
  },
  disabledText: {
    // Color will be applied via theme
  },
  noContentLabel: {
    fontSize: 12,
    marginLeft: 8,
  },
});
