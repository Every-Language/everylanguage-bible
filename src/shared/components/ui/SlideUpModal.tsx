import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetModalProvider,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@/shared/context/ThemeContext';

interface SlideUpModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Snap points for the modal (default: ['80%'] for simple open/close) */
  snapPoints?: string[];
  /** Allow dismissing by tapping outside (default: true) */
  enableDismissOnClose?: boolean;
  /** Allow dismissing by dragging down (default: true) */
  enablePanDownToClose?: boolean;
  /** Custom backdrop component */
  backdropComponent?: React.FC<BottomSheetBackdropProps>;
}

export const SlideUpModal: React.FC<SlideUpModalProps> = ({
  visible,
  onClose,
  children,
  snapPoints = ['80%'], // Default to simple open/close
  enableDismissOnClose = true,
  enablePanDownToClose = true,
  backdropComponent,
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
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={enableDismissOnClose ? onClose : undefined}
        style={[
          props.style,
          {
            // Cover the entire screen from top to bottom
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            position: 'absolute',
          },
        ]}
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
        <BottomSheetView style={styles.content}>{children}</BottomSheetView>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
