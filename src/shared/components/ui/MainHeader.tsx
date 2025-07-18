import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoreIcon } from './icons/AudioIcons';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';
import { useHeader } from '@/shared/contexts/HeaderContext';
import searchIcon from '../../../../assets/images/utility_icons/search.png';
import bibleIcon from '../../../../assets/images/icons/bible2.png';
import playlistIcon from '../../../../assets/images/icons/playlists2.png';

interface MainHeaderProps {
  testID?: string;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ testID }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    bottomContent,
    currentScreen,
    onTitlePress,
    onBiblePress,
    onPlaylistsPress,
    onSearchPress,
    onOptionsPress,
    buttonStates,
  } = useHeader();

  const handleTitlePress = () => {
    if (onTitlePress) {
      onTitlePress();
    } else {
      console.log('Bible title pressed');
    }
  };

  const handleBiblePress = () => {
    if (onBiblePress) {
      onBiblePress();
    } else {
      console.log('Bible button pressed');
    }
  };

  const handlePlaylistsPress = () => {
    if (onPlaylistsPress) {
      onPlaylistsPress();
    } else {
      console.log('Playlists button pressed');
    }
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      console.log('Search button pressed');
    }
  };

  const handleOptionsPress = () => {
    if (onOptionsPress) {
      onOptionsPress();
    } else {
      console.log('Options button pressed');
    }
  };

  // Determine button appearance based on current screen
  const getButtonStyle = (
    buttonType: 'bible' | 'playlists' | 'search' | 'options',
    defaultStyle: any
  ) => {
    let isActive = false;

    // Determine if this button should be active based on current screen
    switch (buttonType) {
      case 'bible':
        isActive = currentScreen === 'bible-books';
        break;
      case 'playlists':
        isActive = currentScreen === 'playlists';
        break;
      case 'search':
        isActive = currentScreen === 'search';
        break;
      case 'options':
        // Options button is never highlighted as requested
        isActive = false;
        break;
    }

    return {
      ...defaultStyle,
      backgroundColor: isActive
        ? colors.navigationSelected
        : colors.navigationUnselected,
    };
  };

  // Get icon tint color based on whether button is active
  const getIconTintColor = (
    buttonType: 'bible' | 'playlists' | 'search' | 'options'
  ) => {
    let isActive = false;

    switch (buttonType) {
      case 'bible':
        isActive = currentScreen === 'bible-books';
        break;
      case 'playlists':
        isActive = currentScreen === 'playlists';
        break;
      case 'search':
        isActive = currentScreen === 'search';
        break;
      case 'options':
        isActive = false;
        break;
    }

    return isActive
      ? colors.navigationSelectedText
      : colors.navigationUnselectedText;
  };

  // Get the title based on current screen
  const getTitle = () => {
    switch (currentScreen) {
      case 'playlists':
        return 'Playlists';
      case 'search':
        return 'Search';
      case 'bible-books':
      default:
        return 'Bible';
    }
  };

  const styles = StyleSheet.create({
    container: {
      paddingTop: insets.top + Dimensions.spacing.xs,
      paddingHorizontal: Dimensions.spacing.md,
      backgroundColor: colors.bibleBooksBackground || colors.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Dimensions.spacing.sm,
      position: 'relative',
    },
    title: {
      fontSize: Fonts.size['3xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      textAlign: 'center',
    },
    titleButton: {
      paddingHorizontal: Dimensions.spacing.sm,
      paddingVertical: Dimensions.spacing.xs,
      borderRadius: Dimensions.radius.sm,
    },
    bibleButton: {
      position: 'absolute',
      left: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playlistsButton: {
      position: 'absolute',
      left: 40,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchButton: {
      position: 'absolute',
      right: 40,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionsButton: {
      position: 'absolute',
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },

    bottomContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Dimensions.spacing.sm,
    },
  });

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.titleButton}
          onPress={handleTitlePress}
          accessibilityRole='button'
          accessibilityLabel='Bible title'
          testID='bible-title-button'
          activeOpacity={0.7}>
          <Text style={styles.title}>{getTitle()}</Text>
        </TouchableOpacity>

        {/* Left side buttons */}
        {buttonStates?.bibleVisible !== false && (
          <TouchableOpacity
            style={getButtonStyle('bible', styles.bibleButton)}
            onPress={handleBiblePress}
            accessibilityLabel='Bible'
            accessibilityRole='button'
            testID='bible-button'>
            <Image
              source={bibleIcon}
              style={{
                width: 16,
                height: 20,
                tintColor: getIconTintColor('bible'),
              }}
            />
          </TouchableOpacity>
        )}

        {buttonStates?.playlistsVisible !== false && (
          <TouchableOpacity
            style={getButtonStyle('playlists', styles.playlistsButton)}
            onPress={handlePlaylistsPress}
            accessibilityLabel='Playlists'
            accessibilityRole='button'
            testID='playlists-button'>
            <Image
              source={playlistIcon}
              style={{
                width: 15,
                height: 19,
                tintColor: getIconTintColor('playlists'),
              }}
            />
          </TouchableOpacity>
        )}

        {/* Right side buttons */}
        {buttonStates?.searchVisible !== false && (
          <TouchableOpacity
            style={getButtonStyle('search', styles.searchButton)}
            onPress={handleSearchPress}
            accessibilityLabel='Search'
            accessibilityRole='button'
            testID='search-button'>
            <Image
              source={searchIcon}
              style={{
                width: 16,
                height: 16,
                tintColor: getIconTintColor('search'),
              }}
            />
          </TouchableOpacity>
        )}

        {buttonStates?.optionsVisible !== false && (
          <TouchableOpacity
            style={getButtonStyle('options', styles.optionsButton)}
            onPress={handleOptionsPress}
            accessibilityLabel='Options menu'
            accessibilityRole='button'
            testID='options-button'>
            <MoreIcon size={16} color={getIconTintColor('options')} />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom content slot (toggle buttons, search bar, etc.) */}
      {bottomContent && (
        <View style={styles.bottomContent}>{bottomContent}</View>
      )}
    </View>
  );
};
