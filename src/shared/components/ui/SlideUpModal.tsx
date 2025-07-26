import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetModalProvider,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@/shared/context/ThemeContext';

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
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0} // Always start at first (and typically only) snap point
        snapPoints={memoizedSnapPoints}
        onChange={handleSheetChanges}
        onDismiss={onClose}
        enableDismissOnClose={enableDismissOnClose}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={backdropComponent || renderBackdrop}
        backgroundStyle={[
          styles.modal,
          { backgroundColor: theme.colors.background },
        ]}
        handleIndicatorStyle={[
          styles.handle,
          { backgroundColor: theme.colors.border },
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
                { borderBottomColor: theme.colors.border },
              ]}>
              {header}
            </View>
          )}

          {/* Scrollable Content */}
          {scrollable ? (
            <BottomSheetScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}>
              {children}
            </BottomSheetScrollView>
          ) : (
            <BottomSheetView style={styles.content}>{children}</BottomSheetView>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
};

const styles = StyleSheet.create({
  modal: {
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
