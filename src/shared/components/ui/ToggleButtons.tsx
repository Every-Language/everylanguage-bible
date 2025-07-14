import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';

interface ToggleOption {
  key: string;
  label: string;
  disabled?: boolean;
}

interface ToggleButtonsProps {
  options: ToggleOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  testID?: string;
  height?: number;
  fontSize?: number;
}

export const ToggleButtons: React.FC<ToggleButtonsProps> = ({
  options,
  selectedKey,
  onSelect,
  testID,
  height = 28,
  fontSize = Fonts.size.base,
}) => {
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
                ? colors.navigationSelected
                : colors.navigationUnselected,
            borderRadius: Dimensions.radius.md,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.navigationSelected,
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
                selectedKey === option.key
                  ? colors.navigationSelectedText
                  : colors.navigationUnselectedText,
            }}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
