import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, YStack, XStack, Card } from 'tamagui';
import { useTheme } from '@/shared/hooks/useTamaguiTheme';

export const ThemeDemo: React.FC = () => {
  const { theme, isDark, toggleTheme, colors, getGlassStyle, getShadowStyle } =
    useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <YStack space='$4' padding='$4'>
        {/* Header */}
        <Card
          backgroundColor={colors.backgroundSecondary}
          borderColor={colors.borderLight}
          borderWidth={1}
          borderRadius='$4'
          padding='$4'
          {...getShadowStyle('medium')}>
          <Text fontSize='$6' fontWeight='bold' color={colors.textPrimary}>
            Oral Mother Tongue Theme Demo
          </Text>
          <Text fontSize='$4' color={colors.textSecondary} marginTop='$2'>
            Current theme: {theme} {isDark ? '🌙' : '☀️'}
          </Text>
          <Button
            onPress={toggleTheme}
            backgroundColor={colors.primary}
            color={colors.textInverse}
            marginTop='$3'>
            Toggle Theme
          </Button>
        </Card>

        {/* Brand Colors */}
        <Card
          backgroundColor={colors.backgroundSecondary}
          borderColor={colors.borderLight}
          borderWidth={1}
          borderRadius='$4'
          padding='$4'
          {...getShadowStyle('light')}>
          <Text
            fontSize='$5'
            fontWeight='bold'
            color={colors.textPrimary}
            marginBottom='$3'>
            Brand Colors
          </Text>
          <YStack space='$2'>
            <ColorSwatch
              label='Primary'
              color={colors.primary}
              textColor={colors.textInverse}
            />
            <ColorSwatch
              label='Secondary'
              color={colors.secondary}
              textColor={colors.textInverse}
            />
            <ColorSwatch
              label='Background'
              color={colors.background}
              textColor={colors.textPrimary}
            />
            <ColorSwatch
              label='Text Primary'
              color={colors.textPrimary}
              textColor={colors.background}
            />
          </YStack>
        </Card>

        {/* Accent Colors */}
        <Card
          backgroundColor={colors.backgroundSecondary}
          borderColor={colors.borderLight}
          borderWidth={1}
          borderRadius='$4'
          padding='$4'
          {...getShadowStyle('light')}>
          <Text
            fontSize='$5'
            fontWeight='bold'
            color={colors.textPrimary}
            marginBottom='$3'>
            Accent Colors
          </Text>
          <YStack space='$2'>
            <ColorSwatch
              label='Accent 1'
              color={colors.accent1}
              textColor={colors.textInverse}
            />
            <ColorSwatch
              label='Accent 2'
              color={colors.accent2}
              textColor={colors.textInverse}
            />
            <ColorSwatch
              label='Accent 3'
              color={colors.accent3}
              textColor={colors.textInverse}
            />
            <ColorSwatch
              label='Accent 4'
              color={colors.accent4}
              textColor={colors.textPrimary}
            />
          </YStack>
        </Card>

        {/* Glassy Effects */}
        <Card
          backgroundColor={colors.backgroundSecondary}
          borderColor={colors.borderLight}
          borderWidth={1}
          borderRadius='$4'
          padding='$4'
          {...getShadowStyle('light')}>
          <Text
            fontSize='$5'
            fontWeight='bold'
            color={colors.textPrimary}
            marginBottom='$3'>
            Glassy Effects
          </Text>
          <YStack space='$3'>
            <View style={[styles.glassCard, getGlassStyle('glass1')]}>
              <Text fontSize='$4' fontWeight='600' color={colors.textPrimary}>
                Glass 1 - Light Blue
              </Text>
            </View>
            <View style={[styles.glassCard, getGlassStyle('glass2')]}>
              <Text fontSize='$4' fontWeight='600' color={colors.textInverse}>
                Glass 2 - Dark Blue
              </Text>
            </View>
            <View style={[styles.glassCard, getGlassStyle('glass3')]}>
              <Text fontSize='$4' fontWeight='600' color={colors.textPrimary}>
                Glass 3 - Cream
              </Text>
            </View>
            <View style={[styles.glassCard, getGlassStyle('glass4')]}>
              <Text fontSize='$4' fontWeight='600' color={colors.textInverse}>
                Glass 4 - Gold
              </Text>
            </View>
          </YStack>
        </Card>

        {/* Shadow Examples */}
        <Card
          backgroundColor={colors.backgroundSecondary}
          borderColor={colors.borderLight}
          borderWidth={1}
          borderRadius='$4'
          padding='$4'
          {...getShadowStyle('light')}>
          <Text
            fontSize='$5'
            fontWeight='bold'
            color={colors.textPrimary}
            marginBottom='$3'>
            Shadow Examples
          </Text>
          <YStack space='$3'>
            <View
              style={[
                styles.shadowCard,
                { backgroundColor: colors.background },
                getShadowStyle('light'),
              ]}>
              <Text fontSize='$4' color={colors.textPrimary}>
                Light Shadow
              </Text>
            </View>
            <View
              style={[
                styles.shadowCard,
                { backgroundColor: colors.background },
                getShadowStyle('medium'),
              ]}>
              <Text fontSize='$4' color={colors.textPrimary}>
                Medium Shadow
              </Text>
            </View>
            <View
              style={[
                styles.shadowCard,
                { backgroundColor: colors.background },
                getShadowStyle('dark'),
              ]}>
              <Text fontSize='$4' color={colors.textPrimary}>
                Dark Shadow
              </Text>
            </View>
            <View
              style={[
                styles.shadowCard,
                { backgroundColor: colors.background },
                getShadowStyle('accent'),
              ]}>
              <Text fontSize='$4' color={colors.textPrimary}>
                Accent Shadow
              </Text>
            </View>
          </YStack>
        </Card>

        {/* Interactive States */}
        <Card
          backgroundColor={colors.backgroundSecondary}
          borderColor={colors.borderLight}
          borderWidth={1}
          borderRadius='$4'
          padding='$4'
          {...getShadowStyle('light')}>
          <Text
            fontSize='$5'
            fontWeight='bold'
            color={colors.textPrimary}
            marginBottom='$3'>
            Interactive States
          </Text>
          <YStack space='$2'>
            <Button
              backgroundColor={colors.interactiveActive}
              color={colors.textInverse}
              disabled={false}>
              Active Button
            </Button>
            <Button
              backgroundColor={colors.interactiveInactive}
              color={colors.textInverse}
              disabled={true}>
              Inactive Button
            </Button>
          </YStack>
        </Card>

        {/* Feedback Colors */}
        <Card
          backgroundColor={colors.backgroundSecondary}
          borderColor={colors.borderLight}
          borderWidth={1}
          borderRadius='$4'
          padding='$4'
          {...getShadowStyle('light')}>
          <Text
            fontSize='$5'
            fontWeight='bold'
            color={colors.textPrimary}
            marginBottom='$3'>
            Feedback Colors
          </Text>
          <YStack space='$2'>
            <ColorSwatch
              label='Success'
              color={colors.feedbackSuccess}
              textColor='#FFFFFF'
            />
            <ColorSwatch
              label='Warning'
              color={colors.feedbackWarning}
              textColor='#FFFFFF'
            />
            <ColorSwatch
              label='Error'
              color={colors.feedbackError}
              textColor='#FFFFFF'
            />
            <ColorSwatch
              label='Loading'
              color={colors.feedbackLoading}
              textColor={colors.textInverse}
            />
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

interface ColorSwatchProps {
  label: string;
  color: string;
  textColor: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({
  label,
  color,
  textColor,
}) => (
  <XStack alignItems='center' space='$3'>
    <View style={[styles.colorSwatch, { backgroundColor: color }]} />
    <Text fontSize='$4' color={textColor} flex={1}>
      {label}
    </Text>
    <Text fontSize='$3' color={textColor} opacity={0.7}>
      {color}
    </Text>
  </XStack>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  glassCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  shadowCard: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
});
