import React from 'react';
import { YStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/shared/hooks/useTamaguiTheme';

export const OnboardingScreen: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <YStack
        flex={1}
        backgroundColor='$background'
        padding='$4'
        justifyContent='center'
        space='$6'>
        {/* Header */}
        <YStack alignItems='center' space='$3' marginBottom='$4'>
          <Text
            fontSize='$10'
            fontWeight='bold'
            textAlign='center'
            color='$textPrimary'
            fontFamily='$heading'>
            Welcome to Bible App
          </Text>
          <Text
            fontSize='$5'
            textAlign='center'
            color='$textSecondary'
            maxWidth={320}>
            Choose your preferred way to get started with your Bible journey
          </Text>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
};
