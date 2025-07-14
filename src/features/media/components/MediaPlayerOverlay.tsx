import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  interpolate,
  runOnJS,
  Extrapolate,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/shared/context/ThemeContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';
import { MiniPlayer } from './MiniPlayer';
import { FullPlayer } from './FullPlayer';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
const MINI_PLAYER_HEIGHT = 80;
const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? 34 : 0; // Approximate safe area for home indicator

export const MediaPlayerOverlay: React.FC = () => {
  const { theme } = useTheme();
  const { state, actions } = useMediaPlayer();
  
  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT); // Start off-screen
  const backgroundOpacity = useSharedValue(0);

  // Initialize animation based on state
  useEffect(() => {
    if (!state.currentTrack) {
      // Hide completely when no track
      translateY.value = withSpring(SCREEN_HEIGHT);
      backgroundOpacity.value = withSpring(0);
      return;
    }

    if (state.isExpanded) {
      // Show full player
      translateY.value = withSpring(STATUS_BAR_HEIGHT);
      backgroundOpacity.value = withSpring(0.8);
    } else {
      // Show mini player
      translateY.value = withSpring(SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - SAFE_AREA_BOTTOM);
      backgroundOpacity.value = withSpring(0);
    }
  }, [state.isExpanded, state.currentTrack]);

  // Gesture handler for mini player swipe
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startY = translateY.value;
    },
    onActive: (event, context: any) => {
      const newY = context.startY + event.translationY;
      const minY = STATUS_BAR_HEIGHT; // Top of screen (expanded)
      const maxY = SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - SAFE_AREA_BOTTOM; // Mini player position
      
      // Clamp the translation
      translateY.value = Math.max(minY, Math.min(maxY, newY));
      
      // Update background opacity based on position
      const progress = interpolate(
        translateY.value,
        [STATUS_BAR_HEIGHT, maxY],
        [1, 0],
        Extrapolate.CLAMP
      );
      backgroundOpacity.value = progress * 0.8;
    },
    onEnd: (event) => {
      const velocity = event.velocityY;
      const currentY = translateY.value;
      const minY = STATUS_BAR_HEIGHT;
      const maxY = SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - SAFE_AREA_BOTTOM;
      const threshold = (minY + maxY) / 2;
      
      let shouldExpand = false;
      
      if (velocity < -800) {
        // Fast upward swipe - expand
        shouldExpand = true;
      } else if (velocity > 800) {
        // Fast downward swipe - collapse
        shouldExpand = false;
      } else {
        // Use position threshold
        shouldExpand = currentY < threshold;
      }
      
      if (shouldExpand) {
        translateY.value = withSpring(minY);
        backgroundOpacity.value = withSpring(0.8);
        runOnJS(actions.expand)();
      } else {
        translateY.value = withSpring(maxY);
        backgroundOpacity.value = withSpring(0);
        runOnJS(actions.collapse)();
      }
    },
  });

  // Animated styles
  const animatedPlayerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  // Don't render if no current track
  if (!state.currentTrack) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Background Blur - only visible when expanding/expanded */}
      <Animated.View 
        style={[styles.backgroundBlur, animatedBackgroundStyle]}
        pointerEvents={state.isExpanded ? 'auto' : 'none'}
      >
        <BlurView
          intensity={60}
          tint={theme.mode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Media Player */}
      <Animated.View style={[styles.playerContainer, animatedPlayerStyle]}>
        {state.isExpanded ? (
          // Full Player
          <View style={styles.fullPlayerWrapper}>
            <FullPlayer />
          </View>
        ) : (
          // Mini Player with gesture handler
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={styles.miniPlayerWrapper}>
              <MiniPlayer />
            </Animated.View>
          </PanGestureHandler>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backgroundBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: 'transparent',
  },
  miniPlayerWrapper: {
    height: MINI_PLAYER_HEIGHT,
    width: SCREEN_WIDTH,
  },
  fullPlayerWrapper: {
    height: SCREEN_HEIGHT - STATUS_BAR_HEIGHT,
    width: SCREEN_WIDTH,
  },
}); 