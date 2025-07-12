import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/shared/store';
import { useResponsive } from '@/shared/hooks';

interface ResponsiveTextProps {
  children: React.ReactNode;
  variant?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: any;
  opacity?: number;
}

const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  variant = 'md',
  weight = 'normal',
  color,
  align = 'left',
  style,
  opacity = 1,
}) => {
  const { colors } = useTheme();
  const { fontSize } = useResponsive();

  const getFontWeight = () => {
    switch (weight) {
      case 'medium':
        return '500';
      case 'semibold':
        return '600';
      case 'bold':
        return 'bold';
      default:
        return 'normal';
    }
  };

  return (
    <Text
      style={[
        {
          fontSize: fontSize[variant],
          fontWeight: getFontWeight(),
          color: color || colors.text,
          textAlign: align,
          opacity,
        },
        style,
      ]}>
      {children}
    </Text>
  );
};

export default ResponsiveText;
