import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@/types/onboarding';
import { YStack, XStack, Text, Button, Switch, Select } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/shared/store';
import { useState } from 'react';

export const OnboardingFlow2Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useTheme();
  const [language, setLanguage] = useState('en');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [theme, setTheme] = useState('auto');

  const handleComplete = () => {
    // Here you would save the user preferences
    navigation.navigate('Home');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <YStack flex={1} backgroundColor='$background' padding='$4' space='$6'>
        {/* Header */}
        <YStack alignItems='center' space='$3' marginBottom='$4'>
          <Text
            fontSize='$10'
            fontWeight='bold'
            textAlign='center'
            color='$textPrimary'
            fontFamily='$heading'>
            Custom Setup
          </Text>
          <Text
            fontSize='$5'
            textAlign='center'
            color='$textSecondary'
            lineHeight='$5'
            maxWidth={300}>
            Personalize your Bible reading experience
          </Text>
        </YStack>

        {/* Settings */}
        <YStack flex={1} space='$4'>
          {/* Language Selection */}
          <YStack space='$2'>
            <Text fontSize='$5' fontWeight='bold' color='$textPrimary'>
              Language
            </Text>
            <Select value={language} onValueChange={setLanguage}>
              <Select.Trigger
                backgroundColor='$backgroundSecondary'
                borderColor='$borderColor'>
                <Select.Value placeholder='Select language' />
              </Select.Trigger>
              <Select.Content>
                <Select.Item index={0} value='en'>
                  <Select.ItemText>English</Select.ItemText>
                </Select.Item>
                <Select.Item index={1} value='es'>
                  <Select.ItemText>Español</Select.ItemText>
                </Select.Item>
                <Select.Item index={2} value='fr'>
                  <Select.ItemText>Français</Select.ItemText>
                </Select.Item>
              </Select.Content>
            </Select>
          </YStack>

          {/* Audio Settings */}
          <YStack space='$2'>
            <Text fontSize='$5' fontWeight='bold' color='$textPrimary'>
              Audio Features
            </Text>
            <XStack
              justifyContent='space-between'
              alignItems='center'
              padding='$3'
              backgroundColor='$backgroundSecondary'
              borderRadius='$3'>
              <Text fontSize='$4' color='$textSecondary'>
                Enable audio playback
              </Text>
              <Switch
                checked={audioEnabled}
                onCheckedChange={setAudioEnabled}
                backgroundColor='$borderColor'
                borderColor='$borderColor'
              />
            </XStack>
          </YStack>

          {/* Theme Selection */}
          <YStack space='$2'>
            <Text fontSize='$5' fontWeight='bold' color='$textPrimary'>
              Theme
            </Text>
            <Select value={theme} onValueChange={setTheme}>
              <Select.Trigger
                backgroundColor='$backgroundSecondary'
                borderColor='$borderColor'>
                <Select.Value placeholder='Select theme' />
              </Select.Trigger>
              <Select.Content>
                <Select.Item index={0} value='auto'>
                  <Select.ItemText>Auto (System)</Select.ItemText>
                </Select.Item>
                <Select.Item index={1} value='light'>
                  <Select.ItemText>Light</Select.ItemText>
                </Select.Item>
                <Select.Item index={2} value='dark'>
                  <Select.ItemText>Dark</Select.ItemText>
                </Select.Item>
              </Select.Content>
            </Select>
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
            Complete Setup
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
