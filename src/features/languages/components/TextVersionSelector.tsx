import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { TextVersionSelectorProps } from '../types';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';

export const TextVersionSelector: React.FC<TextVersionSelectorProps> = ({
  currentVersion,
  onPress,
  disabled = false,
  size = 'md',
  variant = 'full',
}) => {
  const { theme } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingHorizontal: 8, paddingVertical: 6 },
          text: { fontSize: theme.typography.fontSize.sm },
        };
      case 'lg':
        return {
          container: { paddingHorizontal: 20, paddingVertical: 16 },
          text: { fontSize: theme.typography.fontSize.lg },
        };
      default:
        return {
          container: { paddingHorizontal: 12, paddingVertical: 10 },
          text: { fontSize: theme.typography.fontSize.md },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderCompactVariant = () => (
    <TouchableOpacity
      style={[
        styles.compactContainer,
        sizeStyles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        disabled && styles.disabledOpacity,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}>
      <Ionicons name='book' size={16} color={theme.colors.primary} />
      <Text
        style={[
          styles.compactText,
          sizeStyles.text,
          { color: theme.colors.text },
        ]}
        numberOfLines={1}>
        {currentVersion?.name || 'No text'}
      </Text>
      <Ionicons
        name='chevron-down'
        size={14}
        color={theme.colors.textSecondary}
      />
    </TouchableOpacity>
  );

  const renderFullVariant = () => (
    <TouchableOpacity
      style={[
        styles.fullContainer,
        sizeStyles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        disabled && styles.disabledOpacity,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}>
        <Ionicons name='book' size={20} color={theme.colors.primary} />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Text Version
        </Text>

        {currentVersion ? (
          <>
            <Text
              style={[
                styles.versionName,
                sizeStyles.text,
                { color: theme.colors.text },
              ]}
              numberOfLines={1}>
              {currentVersion.name}
            </Text>
            <Text
              style={[
                styles.languageName,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={1}>
              {currentVersion.languageName}
            </Text>
          </>
        ) : (
          <Text
            style={[
              styles.placeholderText,
              sizeStyles.text,
              { color: theme.colors.textSecondary },
            ]}>
            Select text version
          </Text>
        )}
      </View>

      <View style={styles.chevronContainer}>
        <Ionicons
          name='chevron-down'
          size={16}
          color={theme.colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  return variant === 'compact' ? renderCompactVariant() : renderFullVariant();
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 40,
  },
  compactText: {
    flex: 1,
    fontWeight: '500',
  },
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 56,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR_VARIATIONS.BLUE_10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  versionName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  languageName: {
    fontSize: 12,
  },
  placeholderText: {
    fontWeight: '500',
    fontStyle: 'italic',
  },
  disabledOpacity: {
    opacity: 0.6,
  },
});
