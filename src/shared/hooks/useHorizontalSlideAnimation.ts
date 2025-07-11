import {
  useSharedValue,
  withTiming,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

interface UseHorizontalSlideAnimationProps {
  onModeChange: (newMode: string) => void;
  modes: string[];
  currentMode: string;
  sensitivity?: number;
  velocityThreshold?: number;
  positionThreshold?: number;
}

export const useHorizontalSlideAnimation = ({
  onModeChange,
  modes,
  currentMode,
  sensitivity = 200,
  velocityThreshold = 500,
  positionThreshold = 0.3,
}: UseHorizontalSlideAnimationProps) => {
  const slideAnimation = useSharedValue(0);

  // Get current mode index
  const currentModeIndex = modes.indexOf(currentMode);

  // Update animation when mode changes externally
  const updateAnimation = (mode: string) => {
    const modeIndex = modes.indexOf(mode);
    slideAnimation.value = withTiming(modeIndex, {
      duration: 300,
    });
  };

  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: (_, context) => {
        context['shouldHandle'] = false;
        context['startValue'] = slideAnimation.value;
      },
      onActive: (event, context) => {
        const deltaX = Math.abs(event.translationX);
        const deltaY = Math.abs(event.translationY);

        // Only handle if this is clearly a horizontal gesture
        if (deltaX > 20 && deltaX > deltaY * 2) {
          context['shouldHandle'] = true;

          // Add visual feedback during drag - follow the user's finger
          const dragProgress = event.translationX / sensitivity;
          const startValue = context['startValue'] as number;
          const newValue = Math.max(
            0,
            Math.min(modes.length - 1, startValue - dragProgress)
          );
          slideAnimation.value = newValue;
        }
      },
      onEnd: (event, context) => {
        if (!context['shouldHandle']) {
          // Reset animation to current mode if gesture wasn't handled
          slideAnimation.value = withSpring(currentModeIndex, {
            damping: 20,
            stiffness: 300,
          });
          return;
        }

        // Determine final state based on velocity and position
        const velocity = event.velocityX;
        const currentValue = slideAnimation.value;

        let targetIndex: number;

        if (Math.abs(velocity) > velocityThreshold) {
          // Fast swipe - follow velocity direction
          // Positive velocity = swipe right = go to lower index
          // Negative velocity = swipe left = go to higher index
          if (velocity > 0) {
            targetIndex = Math.floor(currentValue);
          } else {
            targetIndex = Math.ceil(currentValue);
          }
        } else {
          // Slow drag - use position threshold
          const fractionalPart = currentValue % 1;
          if (fractionalPart > positionThreshold) {
            targetIndex = Math.ceil(currentValue);
          } else {
            targetIndex = Math.floor(currentValue);
          }
        }

        // Clamp to valid range
        targetIndex = Math.max(0, Math.min(modes.length - 1, targetIndex));

        // Always use spring animation
        slideAnimation.value = withSpring(targetIndex, {
          damping: 20,
          stiffness: 300,
          velocity: velocity / 1000,
        });

        // Update mode state
        const newMode = modes[targetIndex];
        if (newMode && newMode !== currentMode) {
          runOnJS(onModeChange)(newMode);
        }
      },
    });

  return {
    slideAnimation,
    gestureHandler,
    updateAnimation,
  };
};
