import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import type { LanguageEntity } from '../../types';

export interface LanguageNodeProps {
  node: LanguageEntity;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (language: LanguageEntity) => void;
  isNodeExpanded: (nodeId: string) => boolean;
  depth: number;
}

export const LanguageNode: React.FC<LanguageNodeProps> = ({
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
          isDisabled && styles.disabledNode,
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
                isDisabled && styles.disabledText,
              ]}
              numberOfLines={2}>
              {node.name}
            </Text>

            <View style={styles.nodeMetadata}>
              <Text
                style={[
                  styles.nodeLevel,
                  { color: theme.colors.textSecondary },
                  isDisabled && styles.disabledText,
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

      {/* Render children if expanded */}
      {hasChildren && isExpanded && node.children && (
        <View>
          {node.children.map((child: LanguageEntity) => (
            <LanguageNode
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

const styles = StyleSheet.create({
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
