import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';

import {
  PanGestureHandler,
  ScrollView as GestureScrollView,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  OptionsMenu,
  ToggleButtons,
  ProfileMenu,
  LanguageMenu,
  SettingsMenu,
  HelpMenu,
  useHeader,
} from '@/shared';

import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';
import {
  usePlayerOverlayHeight,
  useHorizontalSlideAnimation,
} from '@/shared/hooks';
import { getBookImageSource } from '@/shared/services';

// Playlist types
interface PlaylistItem {
  id: string;
  title: string;
  description: string;
  iconPath: string; // Path to bible book icon
}

interface PlaylistsScreenProps {
  // Options menu props
  showOptionsPanel?: boolean;
  onOptionsClose?: () => void;
  onOpenSubMenu?: (subMenuType: SubMenuType) => void;
  activeSubMenu?: SubMenuType;
  onCloseSubMenu?: () => void;
}

type SubMenuType =
  | 'profile'
  | 'language'
  | 'settings'
  | 'help'
  | 'login'
  | 'theme-demo'
  | null;

type PlaylistMode = 'my-playlists' | 'study-bible' | 'meeting-pattern';

// Mock data for playlists
const getPlaylistData = (): Record<PlaylistMode, PlaylistItem[]> => {
  return {
    'my-playlists': [
      {
        id: 'playlist-1',
        title: 'Morning Devotions',
        description: 'Start your day with inspiring verses',
        iconPath: '19_psalms.png',
      },
      {
        id: 'playlist-2',
        title: 'Evening Reflections',
        description: 'End your day with peaceful meditation',
        iconPath: '20_proverbs.png',
      },
      {
        id: 'playlist-3',
        title: 'Sunday Worship',
        description: 'Songs and verses for worship time',
        iconPath: '43_john.png',
      },
    ],
    'study-bible': [
      {
        id: 'study-1',
        title: 'Gospel of John Study',
        description: 'Deep dive into the life of Jesus',
        iconPath: '43_john.png',
      },
      {
        id: 'study-2',
        title: 'Psalms of David',
        description: 'Exploring worship and praise',
        iconPath: '19_psalms.png',
      },
      {
        id: 'study-3',
        title: "Paul's Letters",
        description: 'Understanding apostolic teachings',
        iconPath: '45_romans.png',
      },
      {
        id: 'study-4',
        title: 'Old Testament Stories',
        description: 'Faith stories from the beginning',
        iconPath: '01_genesis.png',
      },
    ],
    'meeting-pattern': [
      {
        id: 'meeting-1',
        title: 'Weekly Bible Study',
        description: 'Structured study for group meetings',
        iconPath: '44_acts.png',
      },
      {
        id: 'meeting-2',
        title: 'Prayer Circle',
        description: 'Guided prayers and meditation',
        iconPath: '40_matthew.png',
      },
      {
        id: 'meeting-3',
        title: 'Youth Group Sessions',
        description: 'Engaging content for young believers',
        iconPath: '46_1-corinthians.png',
      },
    ],
  };
};

// PlaylistItem component
interface PlaylistItemProps {
  item: PlaylistItem;
  onPress: (item: PlaylistItem) => void;
  testID?: string;
}

const PlaylistItemComponent: React.FC<PlaylistItemProps> = ({
  item,
  onPress,
  testID,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.chapterTileBackground || colors.background,
      borderRadius: Dimensions.radius.lg,
      padding: Dimensions.spacing.md,
      marginBottom: Dimensions.spacing.sm,
      marginHorizontal: Dimensions.spacing.lg,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: Dimensions.radius.md,
      backgroundColor: colors.secondary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Dimensions.spacing.md,
    },
    icon: {
      width: 32,
      height: 32,
      tintColor: colors.primary,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginBottom: Dimensions.spacing.xs,
    },
    description: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
      lineHeight: 18,
    },
  });

  const iconSource = getBookImageSource(item.iconPath);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(item)}
      accessibilityRole='button'
      accessibilityLabel={`${item.title}: ${item.description}`}
      testID={testID}
      activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        {iconSource ? (
          <Image source={iconSource} style={styles.icon} />
        ) : (
          <Text style={{ fontSize: 24, color: styles.icon.tintColor }}>📖</Text>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

// PlaylistView component (similar to TestamentView)
interface PlaylistViewProps {
  items: PlaylistItem[];
  title: string;
  onItemPress: (item: PlaylistItem) => void;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({
  items,
  title,
  onItemPress,
}) => {
  const { colors } = useTheme();
  const { collapsedHeight } = usePlayerOverlayHeight();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: Fonts.size['2xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Dimensions.spacing.lg,
      marginTop: Dimensions.spacing.md,
      paddingHorizontal: Dimensions.spacing.lg,
    },
    scrollContent: {
      paddingBottom: collapsedHeight + Dimensions.spacing.md,
    },
  });

  return (
    <GestureScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps='handled'
      bounces={true}>
      <Text style={styles.title}>{title}</Text>

      {items.map(item => (
        <PlaylistItemComponent
          key={item.id}
          item={item}
          onPress={onItemPress}
          testID={`playlist-item-${item.id}`}
        />
      ))}
    </GestureScrollView>
  );
};

// ContentSwitcher for 3 views (300% wide)
interface ContentSwitcherProps {
  myPlaylists: PlaylistItem[];
  studyBible: PlaylistItem[];
  meetingPattern: PlaylistItem[];
  onItemPress: (item: PlaylistItem) => void;
  slideAnimation: Animated.SharedValue<number>;
}

const ContentSwitcher: React.FC<ContentSwitcherProps> = ({
  myPlaylists,
  studyBible,
  meetingPattern,
  onItemPress,
  slideAnimation,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${slideAnimation.value * -33.333}%` }],
  }));

  return (
    <View style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            width: '300%', // 300% for 3 views
            height: '100%',
          },
          animatedStyle,
        ]}>
        <View style={{ width: '33.333%', height: '100%' }}>
          <PlaylistView
            items={myPlaylists}
            title='My Playlists'
            onItemPress={onItemPress}
          />
        </View>
        <View style={{ width: '33.333%', height: '100%' }}>
          <PlaylistView
            items={studyBible}
            title='Study the Bible'
            onItemPress={onItemPress}
          />
        </View>
        <View style={{ width: '33.333%', height: '100%' }}>
          <PlaylistView
            items={meetingPattern}
            title='Meeting Pattern'
            onItemPress={onItemPress}
          />
        </View>
      </Animated.View>
    </View>
  );
};

export const PlaylistsScreen: React.FC<PlaylistsScreenProps> = ({
  showOptionsPanel = false,
  onOptionsClose,
  onOpenSubMenu,
  activeSubMenu = null,
  onCloseSubMenu,
}) => {
  const { colors } = useTheme();
  const { setCurrentScreen, setBottomContent } = useHeader();
  const [playlistMode, setPlaylistMode] =
    useState<PlaylistMode>('my-playlists');

  // Use the horizontal slide animation hook with 3 modes
  const { slideAnimation, gestureHandler, updateAnimation } =
    useHorizontalSlideAnimation({
      onModeChange: (newMode: string) =>
        setPlaylistMode(newMode as PlaylistMode),
      modes: ['my-playlists', 'study-bible', 'meeting-pattern'],
      currentMode: playlistMode,
    });

  // Update animation when playlist mode changes externally
  useEffect(() => {
    updateAnimation(playlistMode);
  }, [playlistMode, updateAnimation]);

  // Stable toggle handler
  const handleToggleSelect = useCallback((key: string) => {
    setPlaylistMode(key as PlaylistMode);
  }, []);

  // Memoized toggle buttons
  const toggleButtons = useMemo(() => {
    const toggleOptions = [
      { key: 'my-playlists', label: 'My Playlists' },
      { key: 'study-bible', label: 'Study the Bible' },
      { key: 'meeting-pattern', label: 'Meeting Pattern' },
    ];

    return (
      <ToggleButtons
        options={toggleOptions}
        selectedKey={playlistMode}
        onSelect={handleToggleSelect}
        testID='playlist-toggle'
        height={28}
        fontSize={Fonts.size.xs}
      />
    );
  }, [playlistMode, handleToggleSelect]);

  // Set up header content
  useEffect(() => {
    setCurrentScreen('playlists');
  }, [setCurrentScreen]);

  // Update header content when toggle buttons change
  useEffect(() => {
    setBottomContent(toggleButtons);
  }, [setBottomContent, toggleButtons]);

  const handleItemPress = (item: PlaylistItem) => {
    console.log('Playlist item pressed:', item.title);
    // TODO: Implement playlist item navigation/playback
  };

  const playlistData = getPlaylistData();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bibleBooksBackground || colors.background,
    },
  });

  return (
    <View style={styles.container}>
      {/* Content Area with Swipe Support */}
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        simultaneousHandlers={[]}
        shouldCancelWhenOutside={false}
        enableTrackpadTwoFingerGesture={false}
        activeOffsetX={[-20, 20]}
        failOffsetY={[-20, 20]}>
        <Animated.View style={{ flex: 1 }}>
          <ContentSwitcher
            myPlaylists={playlistData['my-playlists']}
            studyBible={playlistData['study-bible']}
            meetingPattern={playlistData['meeting-pattern']}
            onItemPress={handleItemPress}
            slideAnimation={slideAnimation}
          />
        </Animated.View>
      </PanGestureHandler>

      {/* Options Menu */}
      <OptionsMenu
        isVisible={showOptionsPanel}
        onClose={onOptionsClose || (() => {})}
        onNavigateToSubMenu={onOpenSubMenu || (() => {})}
      />

      {/* Profile Menu */}
      <ProfileMenu
        isVisible={activeSubMenu === 'profile'}
        onClose={onCloseSubMenu || (() => {})}
      />

      {/* Language Menu */}
      <LanguageMenu
        isVisible={activeSubMenu === 'language'}
        onClose={onCloseSubMenu || (() => {})}
      />

      {/* Settings Menu */}
      <SettingsMenu
        isVisible={activeSubMenu === 'settings'}
        onClose={onCloseSubMenu || (() => {})}
      />

      {/* Help Menu */}
      <HelpMenu
        isVisible={activeSubMenu === 'help'}
        onClose={onCloseSubMenu || (() => {})}
      />
    </View>
  );
};
