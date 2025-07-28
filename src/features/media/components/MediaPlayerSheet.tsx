import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, Image, Dimensions } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackgroundProps,
  useBottomSheet,
} from '@gorhom/bottom-sheet';

import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/shared/context/ThemeContext';
import { useAudioService } from '@/features/media/hooks/useAudioService';

import { MediaControls } from './MediaControls';
import { TextAndQueueTabs } from './TextAndQueueTabs';
import { TrackDetailsCollapsed } from './TrackDetailsCollapsed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * MediaPlayerSheet - A bottom sheet modal for media playback controls
 *
 * Safe Area Considerations:
 * - Uses useSafeAreaInsets to respect device safe areas
 * - Minimum collapsed height includes bottom safe area padding
 * - Controls container has proper bottom padding for safe area
 * - Expanded height accounts for top safe area
 * - MediaControls component handles its own safe area padding
 */

// Fixed height allocations for expanded view
const EXPANDED_TRACK_DETAILS_HEIGHT = SCREEN_HEIGHT * 0.15; // 15% of screen height
const EXPANDED_TABS_HEIGHT = SCREEN_HEIGHT * 0.7; // 70% of screen height

// Custom Blurred Background Component
const BlurredBackground: React.FC<BottomSheetBackgroundProps> = ({
  style,
  animatedIndex,
}) => {
  const { theme } = useTheme();

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0, 1],
      [0.95, 1], // Increased minimum opacity from 0.8 to 0.95 for better visibility
      Extrapolation.CLAMP
    ),
  }));

  const containerStyle = useMemo(
    () => [style, containerAnimatedStyle],
    [style, containerAnimatedStyle]
  );

  return (
    <Animated.View style={[containerStyle, styles.blurContainer]}>
      <BlurView
        intensity={50} // Increased blur intensity from 30 to 50 for stronger blur effect
        tint={theme.mode === 'dark' ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFillObject, styles.blurContainer]}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor:
              theme.mode === 'dark'
                ? COLOR_VARIATIONS.CHARCOAL_95
                : COLOR_VARIATIONS.CREAM_95,
          },
          styles.blurContainer,
        ]}
      />
    </Animated.View>
  );
};

// Inner content component that has access to useBottomSheet
const MediaPlayerContent: React.FC = () => {
  const { theme } = useTheme();
  const { state } = useAudioService();
  const insets = useSafeAreaInsets();

  // Get the animated index from the bottom sheet context
  const { animatedIndex } = useBottomSheet();

  // Create animated styles based on the real-time animated index
  const trackDetailsAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      animatedIndex.value,
      [0, 1],
      [60, EXPANDED_TRACK_DETAILS_HEIGHT], // Heights for collapsed vs expanded track details
      Extrapolation.CLAMP
    );

    return {
      height,
    };
  });

  const collapsedTrackInfoStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedIndex.value,
      [0, 0.3],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  const expandedTrackInfoStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedIndex.value,
      [0.7, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      animatedIndex.value,
      [0, 1],
      [20, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const verseListContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedIndex.value,
      [0, 0.5, 1],
      [0, 0.3, 1],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      animatedIndex.value,
      [0, 1],
      [50, 0],
      Extrapolation.CLAMP
    );

    // Calculate height with proper safe area consideration
    const availableHeight = EXPANDED_TABS_HEIGHT - insets.bottom;
    const height = interpolate(
      animatedIndex.value,
      [0, 0.3, 1],
      [0, availableHeight * 0.3, availableHeight],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      height,
      transform: [{ translateY }],
    };
  });

  const controlsContainerStyle = useAnimatedStyle(() => {
    // In collapsed mode, position controls right after track details
    // In expanded mode, position at bottom with full height
    const marginTop = interpolate(
      animatedIndex.value,
      [0, 1],
      [8, 0], // Small margin in collapsed, no margin in expanded
      Extrapolation.CLAMP
    );

    return {
      marginTop,
    };
  });

  if (!state.currentTrack) return null;

  return (
    <View style={styles.contentWrapper}>
      <View style={styles.mainContent}>
        {/* Track Details Section - Animates between collapsed and expanded */}
        <Animated.View
          style={[styles.trackDetailsContainer, trackDetailsAnimatedStyle]}>
          {/* Collapsed View - Shows inline track info */}
          <TrackDetailsCollapsed style={collapsedTrackInfoStyle} />

          {/* Expanded View - Shows centered track info with album art */}
          <Animated.View
            style={[styles.expandedTrackInfo, expandedTrackInfoStyle]}>
            <View style={styles.expandedContent}>
              {/* Album Art Placeholder */}
              <View style={styles.albumArtContainer}>
                <Image
                  source={{
                    uri: 'https://via.placeholder.com/80x80/8B5CF6/FFFFFF?text=📖',
                  }}
                  style={styles.albumArt}
                />
              </View>

              <View style={styles.expandedTrackTextContainer}>
                <Text
                  style={[styles.expandedTitle, { color: theme.colors.text }]}
                  numberOfLines={1}>
                  {state.currentTrack.title}
                </Text>
                <Text
                  style={[
                    styles.expandedSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}>
                  {state.currentTrack.subtitle}
                </Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Text and Queue Tabs Section - Animated height and visibility */}
        <Animated.View style={[styles.tabsContainer, verseListContainerStyle]}>
          <TextAndQueueTabs />
        </Animated.View>

        {/* Controls Section - Positioned responsively with proper safe area */}
        <Animated.View
          style={[
            styles.controlsContainer,
            controlsContainerStyle,
            {
              paddingBottom: Math.max(insets.bottom + 16, 36), // Increased bottom padding for better spacing
            },
          ]}>
          <MediaControls showAlbumArt={false} compact={true} />
        </Animated.View>
      </View>
    </View>
  );
};

export const MediaPlayerSheet: React.FC = () => {
  const { theme } = useTheme();
  const { state, actions } = useAudioService();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const isInitializing = useRef(false);
  const currentSheetIndex = useRef(0); // Track current sheet index to prevent unwanted changes

  // Snap points: collapsed (25%), expanded (100vh) - account for safe areas
  const snapPoints = useMemo(() => {
    // Calculate snap points with safe area consideration and additional padding for controls
    const collapsedHeight = Math.max(
      SCREEN_HEIGHT * 0.25,
      180 + insets.bottom + 16
    ); // Increased minimum height for better spacing

    return [`${(collapsedHeight / SCREEN_HEIGHT) * 100}%`, '100%'];
  }, [insets.bottom]);

  // Handle sheet changes for state management only - with improved logic to prevent unwanted state changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      // Prevent state changes during initialization
      if (isInitializing.current) {
        return;
      }

      // Update current sheet index
      currentSheetIndex.current = index;

      // Only update state if there's an actual change needed
      if (index === 0 && state.isExpanded) {
        // Collapsed state - only collapse if currently expanded
        actions.collapse();
      } else if (index === 1 && !state.isExpanded) {
        // Expanded state - only expand if currently collapsed
        actions.expand();
      }
      // If index is -1 (dismissed), don't change the expanded state
      // This prevents the sheet from hiding itself when expanded
    },
    [state.isExpanded, actions]
  );

  // Present/dismiss modal based on track availability
  useEffect(() => {
    if (state.currentTrack) {
      isInitializing.current = true;
      bottomSheetRef.current?.present();

      // Set initial index based on expanded state with a delay to ensure proper initialization
      setTimeout(() => {
        const targetIndex = state.isExpanded ? 1 : 0;
        currentSheetIndex.current = targetIndex;
        bottomSheetRef.current?.snapToIndex(targetIndex);
        isInitializing.current = false;
      }, 150); // Increased delay to ensure proper initialization
    } else {
      // Only dismiss if there's no current track
      bottomSheetRef.current?.dismiss();
    }
  }, [state.currentTrack]);

  // Update sheet position when expanded state changes - with improved logic
  useEffect(() => {
    if (state.currentTrack && !isInitializing.current) {
      const targetIndex = state.isExpanded ? 1 : 0;

      // Only change index if it's different from current to prevent unnecessary updates
      if (currentSheetIndex.current !== targetIndex) {
        currentSheetIndex.current = targetIndex;
        bottomSheetRef.current?.snapToIndex(targetIndex);
      }
    }
  }, [state.isExpanded, state.currentTrack]);

  // Prevent the sheet from being dismissed when expanded
  const handleDismiss = useCallback(() => {
    // If the sheet is expanded and there's a current track, don't allow dismissal
    if (state.isExpanded && state.currentTrack) {
      // Force the sheet back to expanded state
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(1);
      }, 50);
      return;
    }
  }, [state.isExpanded, state.currentTrack]);

  if (!state.currentTrack) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0} // Start collapsed
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      backdropComponent={() => null}
      backgroundComponent={BlurredBackground}
      handleIndicatorStyle={[
        styles.handle,
        {
          backgroundColor: theme.colors.border, // Use theme border color for consistency
        },
      ]}
      enablePanDownToClose={false}
      enableDynamicSizing={false}
      enableOverDrag={false}
      animateOnMount={true}
      keyboardBehavior='fillParent'
      keyboardBlurBehavior='restore'
      android_keyboardInputMode='adjustResize'
      enableHandlePanningGesture={true}
      enableContentPanningGesture={true}
      style={styles.bottomSheetContainer} // Ensure no extra margin that could interfere with safe area
    >
      <BottomSheetView style={styles.content}>
        <MediaPlayerContent />
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  // Content wrapper - no longer needs blur background
  contentWrapper: {
    flex: 1,
    borderRadius: 20, // Add border radius to match background
    overflow: 'hidden', // Ensure content is clipped to rounded corners
  },
  bottomSheetContainer: {
    marginBottom: 0,
    borderRadius: 20, // Add border radius for rounded appearance
    overflow: 'hidden', // Ensure content is clipped to rounded corners
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    borderRadius: 20, // Add border radius for rounded appearance
    overflow: 'hidden', // Ensure content is clipped to rounded corners
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8, // Add bottom padding for better spacing
    borderRadius: 20, // Add border radius to match background
    overflow: 'hidden', // Ensure content is clipped to rounded corners
    // Add subtle shadow for better visibility against blurred background
    shadowColor: COLOR_VARIATIONS.SHADOW_BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3, // For Android shadow
  },

  // Track Details Styles
  trackDetailsContainer: {
    position: 'relative',
    width: '100%',
  },

  // Expanded Track Info
  expandedTrackInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: EXPANDED_TRACK_DETAILS_HEIGHT,
    justifyContent: 'center',
  },
  expandedContent: {
    alignItems: 'center',
    paddingTop: 10,
  },
  albumArtContainer: {
    marginBottom: 12,
  },
  albumArt: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  expandedTrackTextContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  expandedTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  expandedSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },

  // Tabs Container
  tabsContainer: {
    marginVertical: 10,
  },

  // Controls Container
  controlsContainer: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minHeight: 180, // Increased minimum height for better spacing and safe area handling
    paddingTop: 8, // Add top padding for better spacing
  },
});
