import React from 'react';
import { Card, Text, YStack } from 'tamagui';
import { useTheme } from '@/shared/store';

interface OnboardingCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
  title,
  description,
  icon,
  onPress,
  variant = 'primary',
}) => {
  const { isDark } = useTheme();

  return (
    <Card
      elevate
      size='$4'
      bordered
      onPress={onPress}
      backgroundColor={
        variant === 'primary' ? '$backgroundSecondary' : '$backgroundTertiary'
      }
      borderColor={variant === 'primary' ? '$borderColor' : '$borderColorHover'}
      shadowColor={isDark ? '$shadowMedium' : '$shadowLight'}
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={1}
      shadowRadius={8}
      elevation={4}
      flex={1}
      margin='$2'>
      <Card.Header padded>
        <YStack space='$3' alignItems='center'>
          {icon && (
            <YStack
              backgroundColor={
                variant === 'primary' ? '$primary' : '$secondary'
              }
              borderRadius='$10'
              padding='$4'
              marginBottom='$2'>
              {icon}
            </YStack>
          )}
          <Text
            fontSize='$6'
            fontWeight='bold'
            textAlign='center'
            color={variant === 'primary' ? '$textPrimary' : '$textSecondary'}>
            {title}
          </Text>
          <Text
            fontSize='$4'
            textAlign='center'
            color='$textTertiary'
            lineHeight='$4'>
            {description}
          </Text>
        </YStack>
      </Card.Header>
    </Card>
  );
};
