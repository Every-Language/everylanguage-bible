/**
 * Audio Player Widget - Sliding Panel Controller
 *
 * Main controller component that manages the sliding panel architecture
 * for the audio player. Handles transitions between mini-player and full-player modes.
 *
 * Based on the Flutter implementation's sliding_up_panel approach with:
 * - Smooth sliding transitions
 * - Gesture-based navigation
 * - State-aware rendering
 * - Background audio coordination
 * - Memory efficient rendering
 *
 * @since 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, BackHandler } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioActions, useCurrentChapter } from '@/shared/store/audioStore';
import { MiniPlayerView } from './MiniPlayerView';
import { FullPlayerView } from './FullPlayerView';
import { Colors } from '@/shared/constants/colors';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Player Mode
 */
export type PlayerMode = 'hidden' | 'mini' | 'full';

interface AudioPlayerWidgetProps {
  /** Initial player mode */
  initialMode?: PlayerMode;
  /** Callback when player mode changes */
  onModeChange?: (mode: PlayerMode) => void;
  /** Whether the player can be dismissed completely */
  canDismiss?: boolean;
  /** Custom styling */
  style?: object;
}

// ============================================================================
// Constants
// ============================================================================

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINI_PLAYER_HEIGHT = 80;
const PANEL_SNAP_THRESHOLD = 0.3;
const ANIMATION_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 1,
};

// ============================================================================
// Audio Player Widget Component
// ============================================================================

export const AudioPlayerWidget: React.FC<AudioPlayerWidgetProps> = ({
  initialMode = 'hidden',
  onModeChange,
  canDismiss = true,
  style,
}) => {
  const insets = useSafeAreaInsets();

  // State
  const [currentMode, setCurrentMode] = useState<PlayerMode>(initialMode);
  const [isInitialized, setIsInitialized] = useState(false);

  // Global audio state
  const currentChapter = useCurrentChapter();
  const { initializePlayer, cleanup } = useAudioActions();

  // Animation values
  const slideProgress = useSharedValue(0); // 0 = mini, 1 = full
  const backdropOpacity = useSharedValue(0);

  // ========================================================================
  // Computed Values
  // ========================================================================

  const shouldShowPlayer = useMemo(() => {
    return currentChapter !== null && currentMode !== 'hidden';
  }, [currentChapter, currentMode]);

  const isMiniMode = useMemo(() => {
    return currentMode === 'mini';
  }, [currentMode]);

  const isFullMode = useMemo(() => {
    return currentMode === 'full';
  }, [currentMode]);

  // ========================================================================
  // Effects
  // ========================================================================

  // Initialize audio player on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializePlayer();
        setIsInitialized(true);
      } catch {
        // Failed to initialize audio player
        setIsInitialized(false);
      }
    };

    initialize();

    return () => {
      cleanup();
    };
  }, [initializePlayer, cleanup]);

  // Show mini player when audio is loaded
  useEffect(() => {
    if (isInitialized && currentChapter && currentMode === 'hidden') {
      setCurrentMode('mini');
    }
  }, [isInitialized, currentChapter, currentMode]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isFullMode) {
          // Minimize the player when back button is pressed
          setCurrentMode('mini');
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [isFullMode]);

  // Sync mode changes with callback
  useEffect(() => {
    if (onModeChange) {
      onModeChange(currentMode);
    }
  }, [currentMode, onModeChange]);

  // ========================================================================
  // Animation Handlers
  // ========================================================================

  const animateToMini = useCallback(() => {
    slideProgress.value = withSpring(0, ANIMATION_CONFIG);
    backdropOpacity.value = withSpring(0, ANIMATION_CONFIG);
  }, [slideProgress, backdropOpacity]);

  const animateToFull = useCallback(() => {
    slideProgress.value = withSpring(1, ANIMATION_CONFIG);
    backdropOpacity.value = withSpring(0.8, ANIMATION_CONFIG);
  }, [slideProgress, backdropOpacity]);

  const animateToHidden = useCallback(() => {
    slideProgress.value = withSpring(0, ANIMATION_CONFIG);
    backdropOpacity.value = withSpring(0, ANIMATION_CONFIG);
  }, [slideProgress, backdropOpacity]);

  // ========================================================================
  // Mode Change Handlers
  // ========================================================================

  const handleExpand = useCallback(() => {
    setCurrentMode('full');
    animateToFull();
  }, [animateToFull]);

  const handleMinimize = useCallback(() => {
    setCurrentMode('mini');
    animateToMini();
  }, [animateToMini]);

  const handleDismiss = useCallback(() => {
    if (!canDismiss) return;

    setCurrentMode('hidden');
    animateToHidden();
  }, [canDismiss, animateToHidden]);

  const handleClose = useCallback(() => {
    setCurrentMode('hidden');
    animateToHidden();
  }, [animateToHidden]);

  // ========================================================================
  // Gesture Handlers
  // ========================================================================

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      const { translationY } = event;

      if (isFullMode) {
        // In full mode, allow downward swipe to minimize
        const progress = Math.max(
          0,
          Math.min(1, 1 - translationY / SCREEN_HEIGHT)
        );
        slideProgress.value = progress;
        backdropOpacity.value = progress * 0.8;
      } else if (isMiniMode) {
        // In mini mode, allow upward swipe to expand or downward to dismiss
        if (translationY < 0) {
          // Upward swipe - expand
          const progress = Math.max(
            0,
            Math.min(1, Math.abs(translationY) / SCREEN_HEIGHT)
          );
          slideProgress.value = progress;
          backdropOpacity.value = progress * 0.8;
        } else if (canDismiss) {
          // Downward swipe - dismiss
          // Keep slide progress at 0 for mini mode during dismiss gesture
          backdropOpacity.value = 0;
        }
      }
    })
    .onEnd(event => {
      const { translationY, velocityY } = event;

      if (isFullMode) {
        // Determine if should minimize or return to full
        const shouldMinimize =
          translationY > SCREEN_HEIGHT * PANEL_SNAP_THRESHOLD ||
          velocityY > 800;

        if (shouldMinimize) {
          runOnJS(handleMinimize)();
        } else {
          runOnJS(() => {
            setCurrentMode('full');
            animateToFull();
          })();
        }
      } else if (isMiniMode) {
        if (translationY < 0) {
          // Upward swipe
          const shouldExpand =
            Math.abs(translationY) > SCREEN_HEIGHT * PANEL_SNAP_THRESHOLD ||
            velocityY < -800;

          if (shouldExpand) {
            runOnJS(handleExpand)();
          } else {
            runOnJS(animateToMini)();
          }
        } else if (canDismiss) {
          // Downward swipe
          const shouldDismiss =
            translationY > MINI_PLAYER_HEIGHT * PANEL_SNAP_THRESHOLD ||
            velocityY > 500;

          if (shouldDismiss) {
            runOnJS(handleDismiss)();
          } else {
            runOnJS(animateToMini)();
          }
        }
      }
    });

  // ========================================================================
  // Animated Styles
  // ========================================================================

  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const animatedPanelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      slideProgress.value,
      [0, 1],
      [SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - insets.bottom, 0]
    );

    return {
      transform: [{ translateY }],
    };
  });

  // ========================================================================
  // Render
  // ========================================================================

  if (!isInitialized || !shouldShowPlayer) {
    return null;
  }

  return (
    <View style={[styles.container, style]} pointerEvents='box-none'>
      {/* Backdrop */}
      {isFullMode && (
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
      )}

      {/* Sliding Panel */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.panel, animatedPanelStyle]}>
          {/* Mini Player */}
          <MiniPlayerView
            isVisible={isMiniMode}
            slideProgress={slideProgress.value}
            onExpand={handleExpand}
            onDismiss={handleDismiss}
            canSlide={true}
          />

          {/* Full Player */}
          <FullPlayerView
            isVisible={isFullMode}
            slideProgress={slideProgress.value}
            onMinimize={handleMinimize}
            onClose={handleClose}
            canSlide={true}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background.overlay,
    zIndex: 999,
  },

  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    zIndex: 1001,
  },
});

export default AudioPlayerWidget;
