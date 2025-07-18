import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions as RNDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';

interface SlideUpPanelProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  testID?: string;
  // Configuration options
  fullScreen?: boolean; // If true, covers entire safe area; if false, content-sized
  showDragBar?: boolean; // Show drag bar at top
  showCloseButton?: boolean; // Show X button
  backdrop?: boolean; // Show semi-transparent backdrop
}

export const SlideUpPanel: React.FC<SlideUpPanelProps> = ({
  isVisible,
  onClose,
  children,
  title,
  testID,
  fullScreen = true,
  showDragBar = true,
  showCloseButton = true,
  backdrop = true,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const screenHeight = RNDimensions.get('window').height;

  // Animation values
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);
  const startY = useSharedValue(0);

  // Show/hide animations
  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      backdropOpacity.value = withSpring(0.5, {
        damping: 20,
        stiffness: 300,
      });
    } else {
      translateY.value = withSpring(screenHeight, {
        damping: 20,
        stiffness: 300,
      });
      backdropOpacity.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
    }
  }, [isVisible, translateY, backdropOpacity, screenHeight]);

  // Drag gesture handler - similar to MiniPlayer
  const dragGestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: (_, context) => {
        startY.value = translateY.value;
        context['startY'] = startY.value;
      },
      onActive: (event, context) => {
        // Only allow dragging down (positive translationY)
        if (event.translationY > 0) {
          const newValue = Math.max(
            0,
            (context['startY'] as number) + event.translationY
          );
          translateY.value = newValue;
        }
      },
      onEnd: event => {
        const velocity = event.velocityY;
        const currentValue = translateY.value;
        const velocityThreshold = 500;
        const positionThreshold = screenHeight * 0.3;

        let shouldClose = false;

        if (velocity > velocityThreshold) {
          // Fast downward swipe
          shouldClose = true;
        } else if (currentValue > positionThreshold) {
          // Dragged down far enough
          shouldClose = true;
        }

        if (shouldClose) {
          translateY.value = withSpring(screenHeight, {
            damping: 20,
            stiffness: 300,
          });
          backdropOpacity.value = withSpring(0, {
            damping: 20,
            stiffness: 300,
          });
          runOnJS(onClose)();
        } else {
          // Snap back to open position
          translateY.value = withSpring(0, {
            damping: 20,
            stiffness: 300,
          });
        }
      },
    });

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    const maxHeight = fullScreen
      ? screenHeight - insets.top
      : screenHeight * 0.8;
    return {
      transform: [{ translateY: translateY.value }],
      height: fullScreen ? maxHeight : undefined,
      maxHeight: fullScreen ? undefined : maxHeight,
    };
  });

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Drag bar style with feedback like MiniPlayer
  const animatedBarStyle = useAnimatedStyle(() => {
    const dragProgress = Math.min(1, translateY.value / (screenHeight * 0.1));
    return {
      backgroundColor:
        dragProgress > 0.1 ? colors.text + '80' : colors.text + '60',
      width: 40 + dragProgress * 20,
    };
  });

  if (!isVisible) {
    return null;
  }

  const styles = StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      zIndex: 1000,
    },
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDark ? '#282827' : '#F9F7F4',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      ...Dimensions.shadow.lg,
      zIndex: 1001,
      paddingBottom: insets.bottom,
    },
    header: {
      paddingHorizontal: Dimensions.spacing.md,
      paddingTop: Dimensions.spacing.sm,
      position: 'relative',
    },
    dragBarContainer: {
      paddingVertical: Dimensions.spacing.xs,
      alignItems: 'center',
      width: '100%',
    },
    dragBar: {
      height: 5,
      borderRadius: 2.5,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Dimensions.spacing.md,
      position: 'relative',
    },
    title: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      textAlign: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 25,
      height: 25,
      borderRadius: 12.5,
      backgroundColor: isDark ? '#070707' : '#D8D2C6',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    closeButtonLine: {
      position: 'absolute',
      width: 10,
      height: 1,
      backgroundColor: colors.text,
    },
    content: {
      flex: fullScreen ? 1 : 0,
      paddingHorizontal: Dimensions.spacing.md,
      paddingBottom: Dimensions.spacing.md,
    },
  });

  return (
    <>
      {/* Backdrop */}
      {backdrop && (
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
            testID={testID ? `${testID}-backdrop` : 'slide-up-panel-backdrop'}
          />
        </Animated.View>
      )}

      {/* Panel Container */}
      <Animated.View
        style={[styles.container, animatedContainerStyle]}
        testID={testID}>
        <PanGestureHandler
          onGestureEvent={dragGestureHandler}
          simultaneousHandlers={[]}
          shouldCancelWhenOutside={false}
          enableTrackpadTwoFingerGesture={false}
          activeOffsetY={[-10, 10]}
          failOffsetX={[-20, 20]}>
          <Animated.View style={styles.header}>
            {/* Drag Bar */}
            {showDragBar && (
              <View style={styles.dragBarContainer}>
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    paddingVertical: Dimensions.spacing.sm,
                    paddingHorizontal: Dimensions.spacing.xl,
                  }}
                  testID={
                    testID ? `${testID}-drag-bar` : 'slide-up-panel-drag-bar'
                  }>
                  <Animated.View style={[styles.dragBar, animatedBarStyle]} />
                </TouchableOpacity>
              </View>
            )}

            {/* Title */}
            {title && (
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{title}</Text>
              </View>
            )}
          </Animated.View>
        </PanGestureHandler>

        {/* Close Button - positioned in rounded corner */}
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            testID={
              testID ? `${testID}-close-button` : 'slide-up-panel-close-button'
            }>
            <View
              style={[
                styles.closeButtonLine,
                { transform: [{ rotate: '45deg' }] },
              ]}
            />
            <View
              style={[
                styles.closeButtonLine,
                { transform: [{ rotate: '-45deg' }] },
              ]}
            />
          </TouchableOpacity>
        )}

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </>
  );
};
