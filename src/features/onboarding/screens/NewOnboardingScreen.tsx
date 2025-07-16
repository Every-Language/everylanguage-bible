import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@/types/onboarding';
import { YStack, XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/shared/store';
import { OnboardingCard } from '../components/OnboardingCard';

export const NewOnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useTheme();

  const handleFirstCardPress = () => {
    // Navigate to the first onboarding flow
    navigation.navigate('OnboardingFlow1');
  };

  const handleSecondCardPress = () => {
    // Navigate to the second onboarding flow
    navigation.navigate('OnboardingFlow2');
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
            Welcome to Bible App
          </Text>
          <Text
            fontSize='$5'
            textAlign='center'
            color='$textSecondary'
            lineHeight='$5'
            maxWidth={300}>
            Choose your preferred way to get started with your Bible journey
          </Text>
        </YStack>

        {/* Cards Container */}
        <XStack
          space='$4'
          flex={1}
          justifyContent='center'
          alignItems='center'
          paddingHorizontal='$2'
          flexDirection='row'
          flexWrap='wrap'>
          <OnboardingCard
            title='Quick Start'
            description='Jump right into reading and listening to the Bible with our guided setup'
            variant='primary'
            onPress={handleFirstCardPress}
            icon={
              <Text fontSize='$8' color='$textInverse'>
                🚀
              </Text>
            }
          />

          <OnboardingCard
            title='Custom Setup'
            description='Personalize your experience with language, audio, and theme preferences'
            variant='secondary'
            onPress={handleSecondCardPress}
            icon={
              <Text fontSize='$8' color='$textInverse'>
                ⚙️
              </Text>
            }
          />
        </XStack>

        {/* Footer */}
        <YStack alignItems='center' space='$2' marginTop='$4'>
          <Text fontSize='$3' textAlign='center' color='$textTertiary'>
            You can change these settings later
          </Text>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
};
