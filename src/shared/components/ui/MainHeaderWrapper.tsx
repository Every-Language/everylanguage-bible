import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  HeaderProvider,
  HeaderProviderProps,
} from '@/shared/contexts/HeaderContext';
import { MainHeader } from './MainHeader';
import { useTheme } from '@/shared/store';

interface MainHeaderWrapperProps extends Omit<HeaderProviderProps, 'children'> {
  children: React.ReactNode;
  testID?: string;
}

export const MainHeaderWrapper: React.FC<MainHeaderWrapperProps> = ({
  children,
  onTitlePress,
  onBiblePress,
  onPlaylistsPress,
  onSearchPress,
  onOptionsPress,
  testID,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentArea: {
      flex: 1,
    },
  });

  return (
    <HeaderProvider
      onTitlePress={onTitlePress}
      onBiblePress={onBiblePress}
      onPlaylistsPress={onPlaylistsPress}
      onSearchPress={onSearchPress}
      onOptionsPress={onOptionsPress}>
      <View style={styles.container} testID={testID}>
        <MainHeader testID='main-header' />
        <View style={styles.contentArea}>{children}</View>
      </View>
    </HeaderProvider>
  );
};
