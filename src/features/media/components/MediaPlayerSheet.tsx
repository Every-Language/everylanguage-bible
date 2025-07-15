import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  useBottomSheet,
} from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '@/shared/context/ThemeContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';
import { MediaControls } from './MediaControls';
import { VerseListAndQueue } from './VerseListAndQueue';

// Inner content component that has access to useBottomSheet
const MediaPlayerContent: React.FC<{
  viewMode: 'text' | 'queue';
  setViewMode: (mode: 'text' | 'queue') => void;
}> = ({ viewMode, setViewMode }) => {
  const { theme } = useTheme();
  const { state } = useMediaPlayer();

  // Get the animated index from the bottom sheet context
  const { animatedIndex } = useBottomSheet();

  // Create animated styles based on the real-time animated index
  const trackDetailsAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      animatedIndex.value,
      [0, 1],
      [60, 120], // Heights for collapsed vs expanded track details
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
      [0, 0, 1],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      animatedIndex.value,
      [0, 1],
      [50, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  if (!state.currentTrack) return null;

  return (
    <>
      {/* Background Blur */}
      <BlurView
        intensity={80}
        tint={theme.mode === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor:
              theme.mode === 'dark'
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.3)',
          },
        ]}
      />

      {/* Main Content Container */}
      <View style={styles.mainContent}>
        {/* Track Details Section - Animates between collapsed and expanded */}
        <Animated.View
          style={[styles.trackDetailsContainer, trackDetailsAnimatedStyle]}>
          {/* Collapsed View - Shows inline track info */}
          <Animated.View
            style={[styles.collapsedTrackInfo, collapsedTrackInfoStyle]}>
            <View style={styles.collapsedContent}>
              <View style={styles.trackInfoLeft}>
                <Text
                  style={[styles.collapsedTitle, { color: theme.colors.text }]}
                  numberOfLines={1}>
                  {state.currentTrack.title}
                </Text>
                <Text
                  style={[
                    styles.collapsedSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}>
                  {state.currentTrack.subtitle}
                </Text>
              </View>
              <Text
                style={[
                  styles.collapsedLanguage,
                  { color: theme.colors.textSecondary },
                ]}>
                ENGLISH - BSB
              </Text>
            </View>
          </Animated.View>

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

              {/* Toggle Buttons */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    viewMode === 'text' && [
                      styles.activeToggle,
                      { backgroundColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setViewMode('text')}>
                  <Text
                    style={[
                      styles.toggleButtonText,
                      {
                        color:
                          viewMode === 'text'
                            ? theme.colors.background
                            : theme.colors.text,
                      },
                    ]}>
                    Text
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    viewMode === 'queue' && [
                      styles.activeToggle,
                      { backgroundColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setViewMode('queue')}>
                  <Text
                    style={[
                      styles.toggleButtonText,
                      {
                        color:
                          viewMode === 'queue'
                            ? theme.colors.background
                            : theme.colors.text,
                      },
                    ]}>
                    Queue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Verse List/Queue Section - Only visible when expanded */}
        <Animated.View
          style={[styles.verseListContainer, verseListContainerStyle]}>
          <VerseListAndQueue viewMode={viewMode} />
        </Animated.View>

        {/* Controls Section - Always at bottom with consistent height */}
        <View style={styles.controlsContainer}>
          <MediaControls showAlbumArt={false} compact={true} />
        </View>
      </View>
    </>
  );
};

export const MediaPlayerSheet: React.FC = () => {
  const { state, actions } = useMediaPlayer();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [viewMode, setViewMode] = useState<'text' | 'queue'>('text');

  // Snap points: collapsed (25%), expanded (100%)
  const snapPoints = useMemo(() => ['25%', '100%'], []);

  // Handle sheet changes for state management only
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === 0) {
        // Collapsed state
        if (state.isExpanded) {
          actions.collapse();
        }
      } else if (index === 1) {
        // Expanded state
        if (!state.isExpanded) {
          actions.expand();
        }
      }
    },
    [state.isExpanded, actions]
  );

  // Present/dismiss modal based on track availability
  useEffect(() => {
    if (state.currentTrack) {
      bottomSheetRef.current?.present();
      // Set initial index based on expanded state
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(state.isExpanded ? 1 : 0);
      }, 100);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [state.currentTrack]);

  // Update sheet position when expanded state changes
  useEffect(() => {
    if (state.currentTrack) {
      bottomSheetRef.current?.snapToIndex(state.isExpanded ? 1 : 0);
    }
  }, [state.isExpanded, state.currentTrack]);

  if (!state.currentTrack) return null;

  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0} // Start collapsed
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={() => null}
        backgroundStyle={[styles.sheet, { backgroundColor: 'transparent' }]}
        handleIndicatorStyle={[styles.handle, { backgroundColor: '#ccc' }]}
        enablePanDownToClose={false}
        keyboardBehavior='fillParent'
        keyboardBlurBehavior='restore'
        android_keyboardInputMode='adjustResize'>
        <BottomSheetView style={styles.content}>
          <MediaPlayerContent viewMode={viewMode} setViewMode={setViewMode} />
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
};

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Track Details Styles
  trackDetailsContainer: {
    position: 'relative',
    width: '100%',
  },

  // Collapsed Track Info
  collapsedTrackInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  trackInfoLeft: {
    flex: 1,
    marginRight: 12,
  },
  collapsedTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  collapsedSubtitle: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.8,
  },
  collapsedLanguage: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },

  // Expanded Track Info
  expandedTrackInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
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
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  activeToggle: {
    // backgroundColor set dynamically
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Verse List Container
  verseListContainer: {
    flex: 1,
    marginTop: 8,
  },

  // Controls Container
  controlsContainer: {
    paddingVertical: 8,
    paddingBottom: 10,
  },
});
