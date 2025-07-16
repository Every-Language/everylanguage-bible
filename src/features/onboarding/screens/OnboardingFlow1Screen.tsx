import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@/types/onboarding';
import { YStack, Text, Button } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/shared/store';

export const OnboardingFlow1Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useTheme();

  const handleComplete = () => {
    navigation.navigate('Home');
  };

  const handleBack = () => {
    navigation.goBack();
  };

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
            Quick Start
          </Text>
          <Text
            fontSize='$5'
            textAlign='center'
            color='$textSecondary'
            lineHeight='$5'
            maxWidth={300}>
            You&apos;re all set! Start exploring the Bible right away.
          </Text>
        </YStack>

        {/* Content */}
        <YStack flex={1} justifyContent='center' alignItems='center' space='$6'>
          <YStack space='$4' alignItems='center'>
            <Text
              fontSize='$6'
              fontWeight='bold'
              textAlign='center'
              color='$textPrimary'>
              Ready to Begin
            </Text>
            <Text
              fontSize='$4'
              textAlign='center'
              color='$textSecondary'
              lineHeight='$4'
              maxWidth={280}>
              Your Bible app is configured with default settings. You can
              customize preferences anytime in the settings.
            </Text>
          </YStack>
        </YStack>

        {/* Actions */}
        <YStack space='$3'>
          <Button
            size='$5'
            backgroundColor='$primary'
            color='$textInverse'
            fontWeight='bold'
            onPress={handleComplete}>
            Start Reading
          </Button>

          <Button
            size='$4'
            variant='outlined'
            borderColor='$borderColor'
            color='$textSecondary'
            onPress={handleBack}>
            Back
          </Button>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
};
