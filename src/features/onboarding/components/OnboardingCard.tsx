import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { getContrastTextColor } from '../utils/colorUtils';

interface OnboardingCardProps {
  icon: string;
  title: string;
  description: string;
  backgroundColor: string;
  onPress?: (() => void) | undefined;
  disabled?: boolean;
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
  icon,
  title,
  description,
  backgroundColor,
  onPress,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const textColor = getContrastTextColor(backgroundColor, theme);
  const iconBackgroundColor =
    textColor === theme.colors.text
      ? 'rgba(0, 0, 0, 0.1)'
      : 'rgba(255, 255, 255, 0.2)';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
        },
      ]}>
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={onPress}
        disabled={disabled}>
        <View
          style={[
            styles.cardIcon,
            {
              backgroundColor: iconBackgroundColor,
            },
          ]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
          <Text
            style={[
              styles.cardDescription,
              getCardDescriptionStyle(textColor),
            ]}>
            {description}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const getCardDescriptionStyle = (textColor: string) => ({
  color: textColor,
  opacity: 0.9,
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    width: '100%',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 100,
  },
  cardTouchable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    marginTop: 2,
    flexShrink: 0,
  },
  iconText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
});
