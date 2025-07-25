import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/shared/store';
import { createInstructionalTextStyles } from './InstructionalText.styles';

export interface InstructionalTextProps {
  title?: string;
  description?: string;
}

export const InstructionalText: React.FC<InstructionalTextProps> = ({
  title = 'Search the Bible',
  description = 'Search for books, chapters, or specific content',
}) => {
  const { colors } = useTheme();
  const styles = createInstructionalTextStyles();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.text, { color: colors.secondary }]}>
        {description}
      </Text>
    </View>
  );
};
