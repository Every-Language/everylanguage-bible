import { View, ScrollView } from 'react-native';
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

  const containerStyle = {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: padding.horizontal,
    paddingVertical: padding.vertical,
  };

  const contentStyles = {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.lg,
  };

  if (!scrollEnabled) {
    return (
      <View style={containerStyle}>
        <View style={[contentStyles, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={[contentStyles, contentStyle]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
};

export default BaseSlide;
