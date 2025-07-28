import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
  BottomSheetBackgroundProps,
} from '@gorhom/bottom-sheet';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '@/shared/context/ThemeContext';
import { BRAND_COLORS, COLOR_VARIATIONS } from '@/shared/constants/theme';

const getContentPaddingStyle = (insets: { bottom: number }) => ({
  paddingBottom: Platform.OS === 'ios' ? 16 : insets.bottom + 16,
});

// Custom background component for consistent solid colors across all platforms
const SolidBackground: React.FC<BottomSheetBackgroundProps> = ({
  style,
  animatedIndex,
}) => {
  const { theme } = useTheme();

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0, 1],
      [0.95, 1],
      Extrapolation.CLAMP
    ),
  }));

  const containerStyle = useMemo(
    () => [style, containerAnimatedStyle],
    [style, containerAnimatedStyle]
  );

  return (
    <Animated.View style={containerStyle}>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          styles.backgroundView,
          {
            backgroundColor:
              theme.mode === 'dark'
                ? COLOR_VARIATIONS.CHARCOAL_DARK // Use theme's solid dark color
                : BRAND_COLORS.WHITE, // Use theme's solid white color
          },
        ]}
      />
    </Animated.View>
  );
};

interface SlideUpModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Fixed header content that stays at the top */
  header?: React.ReactNode;
  /** Snap points for the modal (default: ['70%'] for consistent height) */
  snapPoints?: string[];
  /** Allow dismissing by tapping outside (default: true) */
  enableDismissOnClose?: boolean;
  /** Allow dismissing by dragging down (default: true) */
  enablePanDownToClose?: boolean;
  /** Custom backdrop component */
  backdropComponent?: React.FC<BottomSheetBackdropProps>;
  /** Whether to use scrollable content area (default: true) */
  scrollable?: boolean;
}

export const SlideUpModal: React.FC<SlideUpModalProps> = ({
  visible,
  onClose,
  children,
  header,
  snapPoints = ['70%'], // Default to consistent height like profile modal
  enableDismissOnClose = true,
  enablePanDownToClose = true,
  backdropComponent,
  scrollable = true,
}) => {
  const { theme } = useTheme();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  // Memoize snap points for better performance
  const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  // Present/dismiss modal based on visible prop
  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      // If modal is dismissed (index -1), call onClose
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  // Custom backdrop component that covers the entire screen
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={enableDismissOnClose ? onClose : () => {}}
        style={[props.style, styles.overlay]}
      />
    ),
    [enableDismissOnClose, onClose]
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0} // Always start at first (and typically only) snap point
      snapPoints={memoizedSnapPoints}
      onChange={handleSheetChanges}
      onDismiss={onClose}
      enableDismissOnClose={enableDismissOnClose}
      enablePanDownToClose={enablePanDownToClose}
      backdropComponent={backdropComponent || renderBackdrop}
      backgroundComponent={SolidBackground}
      backgroundStyle={undefined}
      handleIndicatorStyle={[
        styles.handle,
        {
          backgroundColor:
            theme.mode === 'dark'
              ? COLOR_VARIATIONS.CHARCOAL_LIGHT // Use solid color for better visibility
              : COLOR_VARIATIONS.CREAM_DARK, // Use solid color for better visibility
        },
      ]}
      keyboardBehavior='fillParent'
      keyboardBlurBehavior='restore'
      android_keyboardInputMode='adjustResize'>
      <BottomSheetView style={styles.container}>
        {/* Fixed Header */}
        {header && (
          <View
            style={[
              styles.header,
              {
                borderBottomColor:
                  theme.mode === 'dark'
                    ? COLOR_VARIATIONS.CHARCOAL_LIGHT // Use solid color for better visibility
                    : COLOR_VARIATIONS.CREAM_DARK, // Use solid color for better visibility
              },
            ]}>
            {header}
          </View>
        )}

        {/* Scrollable Content */}
        {scrollable ? (
          <BottomSheetScrollView
            style={styles.scrollContent}
            contentContainerStyle={[
              styles.scrollContentContainer,
              getContentPaddingStyle(insets),
            ]}
            showsVerticalScrollIndicator={false}>
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView
            style={[styles.content, getContentPaddingStyle(insets)]}>
            {children}
          </BottomSheetView>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  backgroundView: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // iOS shadow properties
    shadowColor: BRAND_COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    // Android elevation - increased for better visibility on older devices
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
  },
  overlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
  },
});
