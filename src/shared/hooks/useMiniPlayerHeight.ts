import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook to calculate the mini player's collapsed height
 * This ensures consistent spacing across the app
 */
export const useMiniPlayerHeight = () => {
  const insets = useSafeAreaInsets();

  // Mini player collapsed height calculation
  // This matches the calculation in MiniPlayer.tsx
  const bottomControlsHeight = 190; // Height for all controls: expand bar + title + progress + buttons + padding
  const collapsedHeight = bottomControlsHeight + insets.bottom;

  return {
    collapsedHeight,
    bottomControlsHeight,
    safeAreaBottom: insets.bottom,
  };
};
