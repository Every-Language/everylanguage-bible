import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/shared/store';
import { Dimensions, Fonts } from '@/shared/constants';

interface MediaPlayerAdvancedPanelProps {
  testID?: string;
}

export const MediaPlayerAdvancedPanel: React.FC<
  MediaPlayerAdvancedPanelProps
> = ({ testID }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: Dimensions.radius.lg,
      margin: Dimensions.spacing.md,
      padding: Dimensions.spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: Fonts.size.lg,
      color: colors.text,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.placeholderText}>Advanced Media Player Panel</Text>
      <Text
        style={[
          styles.placeholderText,
          { fontSize: Fonts.size.sm, marginTop: Dimensions.spacing.md },
        ]}>
        (Future features will go here)
      </Text>
    </View>
  );
};
