import { View, StyleSheet, ScrollView } from 'react-native';
import React from 'react';
import { useTheme } from '@/shared/store';
import { useResponsive } from '@/shared/hooks';

interface BaseSlideProps {
  children: React.ReactNode;
  contentStyle?: any;
  scrollEnabled?: boolean;
}

const BaseSlide: React.FC<BaseSlideProps> = ({
  children,
  contentStyle,
  scrollEnabled = true,
}) => {
  const { colors } = useTheme();
  const { padding, spacing } = useResponsive();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: padding.horizontal,
      paddingVertical: padding.vertical,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
  });

  if (!scrollEnabled) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
};

export default BaseSlide;
