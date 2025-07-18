import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo } from 'react';

export const usePlayerOverlayHeight = () => {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    // This matches the calculation in PlayerOverlay.tsx
    const bottomControlsHeight = 190;
    const collapsedHeight = bottomControlsHeight + insets.bottom;

    return {
      collapsedHeight,
      bottomControlsHeight,
      insets,
    };
  }, [insets]);
};
