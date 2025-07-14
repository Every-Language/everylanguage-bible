import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';

interface ToggleOption<T extends string> {
  key: T;
  label: string;
  disabled?: boolean;
}

interface ToggleButtonsProps<T extends string> {
  options: ToggleOption<T>[];
  selectedKey: T;
  onSelect: (key: T) => void;
  testID?: string;
  height?: number;
  fontSize?: number;
}

export const ToggleButtons = <T extends string>({
  options,
  selectedKey,
  onSelect,
  testID,
  height = 28,
  fontSize = Fonts.size.base,
}: ToggleButtonsProps<T>) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: Dimensions.spacing.md,
      }}
      testID={testID}>
      {options.map(option => (
        <TouchableOpacity
          key={option.key}
          style={{
            flex: 1,
            height: height,
            backgroundColor:
              selectedKey === option.key
                ? colors.primary
                : colors.primary + '20',
            borderRadius: Dimensions.radius.md,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.primary,
            opacity: option.disabled ? 0.5 : 1,
          }}
          onPress={() => {
            if (!option.disabled) {
              onSelect(option.key);
            }
          }}
          disabled={option.disabled}
          testID={`${testID}-${option.key}`}>
          <Text
            style={{
              fontSize: fontSize,
              fontWeight: Fonts.weight.medium,
              color:
                selectedKey === option.key ? colors.background : colors.primary,
            }}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
