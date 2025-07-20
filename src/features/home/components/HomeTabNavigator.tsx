import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { useTranslations } from '@/shared/context/LocalizationContext';
import { HomeTab } from '../types';

interface HomeTabNavigatorProps {
  activeTab: HomeTab;
  onTabPress: (tab: HomeTab) => void;
}

export const HomeTabNavigator: React.FC<HomeTabNavigatorProps> = ({
  activeTab,
  onTabPress,
}) => {
  const { theme } = useTheme();
  const t = useTranslations();

  const tabs: HomeTab[] = ['Bible', 'Playlists'];

  return (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: theme.colors.background },
      ]}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && [
              styles.activeTab,
              { backgroundColor: theme.colors.primary },
            ],
          ]}
          onPress={() => onTabPress(tab)}>
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === tab
                    ? theme.colors.textInverse
                    : theme.colors.textSecondary,
              },
            ]}>
            {t(`tabs.${tab.toLowerCase()}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});
