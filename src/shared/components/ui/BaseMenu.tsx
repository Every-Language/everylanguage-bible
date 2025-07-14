import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
} from 'react-native';
import { SlideUpPanel } from './SlideUpPanel';
import { useTheme } from '@/shared/store';
import { Dimensions, Fonts } from '@/shared/constants';
import {
  BaseMenuProps,
  BaseMenuOption,
  MenuOptionWithDescription,
  ToggleMenuOption,
  MenuSection,
} from '@/types/menu';

// Type guards to determine option type
const isToggleOption = (option: any): option is ToggleMenuOption => {
  return 'value' in option && 'onToggle' in option;
};

const hasDescription = (option: any): option is MenuOptionWithDescription => {
  return 'description' in option && option.description;
};

export const BaseMenu: React.FC<BaseMenuProps> = ({
  isVisible,
  onClose,
  config,
  customContent,
}) => {
  const { colors, isDark } = useTheme();

  const handleOptionPress = (option: BaseMenuOption | ToggleMenuOption) => {
    if (isToggleOption(option)) {
      option.onToggle();
    } else {
      option.onPress();
    }
  };

  const renderOption = (
    option: BaseMenuOption | MenuOptionWithDescription | ToggleMenuOption
  ) => {
    const isToggle = isToggleOption(option);
    const withDescription = hasDescription(option);

    return (
      <TouchableOpacity
        key={option.key}
        style={[
          styles.optionCard,
          { backgroundColor: isDark ? '#414141' : '#EAE9E7' },
          withDescription && styles.optionCardWithDescription,
        ]}
        onPress={() => !isToggle && handleOptionPress(option)}
        accessibilityLabel={option.label}
        accessibilityRole='button'
        testID={`${config.testID}-${option.key}`}
        disabled={isToggle}>
        <View style={styles.iconContainer}>
          <Image
            source={option.icon}
            style={[styles.icon, { tintColor: colors.text }]}
            resizeMode='contain'
          />
        </View>

        <View style={styles.optionContent}>
          {withDescription ? (
            <View style={styles.optionInfo}>
              <Text style={[styles.label, { color: colors.text }]}>
                {option.label}
              </Text>
              <Text style={[styles.description, { color: colors.secondary }]}>
                {option.description}
              </Text>
            </View>
          ) : (
            <Text style={[styles.label, { color: colors.text }]}>
              {option.label}
            </Text>
          )}
        </View>

        {isToggle && (
          <Switch
            value={option.value}
            onValueChange={option.onToggle}
            trackColor={{
              false: colors.secondary + '30',
              true: colors.primary + '80',
            }}
            thumbColor={option.value ? colors.primary : '#f4f3f4'}
            ios_backgroundColor={colors.secondary + '30'}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderSection = (section: MenuSection, index: number) => (
    <View key={`section-${index}`}>
      {section.title && (
        <Text style={[styles.sectionHeader, { color: colors.text }]}>
          {section.title}
        </Text>
      )}
      <View style={styles.optionsContainer}>
        {section.options.map(renderOption)}
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: Dimensions.spacing.md,
    },
    headerSection: {
      alignItems: 'center',
      paddingVertical: Dimensions.spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary + '20',
      marginBottom: Dimensions.spacing.lg,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? '#414141' : '#EAE9E7',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.md,
    },
    avatarIcon: {
      width: 80,
      height: 80,
      tintColor: colors.text,
    },
    headerTitle: {
      fontSize: Fonts.size.xl,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginBottom: Dimensions.spacing.xs,
    },
    headerSubtitle: {
      fontSize: Fonts.size.base,
      color: colors.secondary,
    },
    sectionHeader: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginBottom: Dimensions.spacing.md,
      marginTop: Dimensions.spacing.lg,
    },
    optionsContainer: {
      gap: Dimensions.spacing.sm,
    },
    optionCard: {
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 50,
    },
    optionCardWithDescription: {
      minHeight: 70,
    },
    iconContainer: {
      width: 24,
      height: 24,
      marginRight: Dimensions.spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      width: 20,
      height: 20,
    },
    optionContent: {
      flex: 1,
    },
    label: {
      fontSize: Fonts.size.base,
      fontWeight: Fonts.weight.medium,
    },
    optionInfo: {
      flex: 1,
    },
    description: {
      fontSize: Fonts.size.sm,
      marginTop: Dimensions.spacing.xs,
    },
  });

  return (
    <SlideUpPanel
      isVisible={isVisible}
      onClose={onClose}
      title={config.title}
      fullScreen={config.fullScreen ?? false}
      testID={config.testID}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Optional Header */}
        {config.header && (
          <View style={styles.headerSection}>
            {config.header.avatarSource && (
              <View style={styles.avatarContainer}>
                <Image
                  source={config.header.avatarSource}
                  style={styles.avatarIcon}
                  resizeMode='contain'
                />
              </View>
            )}
            {config.header.title && (
              <Text style={styles.headerTitle}>{config.header.title}</Text>
            )}
            {config.header.subtitle && (
              <Text style={styles.headerSubtitle}>
                {config.header.subtitle}
              </Text>
            )}
          </View>
        )}

        {/* Custom Content */}
        {customContent}

        {/* Sections */}
        {config.sections?.map(renderSection)}

        {/* Simple Options (no sections) */}
        {config.options && !config.sections && (
          <View style={styles.optionsContainer}>
            {config.options.map(renderOption)}
          </View>
        )}
      </ScrollView>
    </SlideUpPanel>
  );
};
