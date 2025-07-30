import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PermissionsManager } from '@/shared/components/PermissionsManager';
import { useTheme } from '@/shared/hooks';

interface PermissionsScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({
  onComplete,
  onSkip: _onSkip,
}) => {
  const { theme } = useTheme();

  const handlePermissionsGranted = () => {
    // Continue to next onboarding step
    onComplete();
  };

  const handlePermissionsDenied = () => {
    // Still continue, but user may have limited functionality
    onComplete();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <PermissionsManager
        showOnlyMissing={true}
        onPermissionsGranted={handlePermissionsGranted}
        onPermissionsDenied={handlePermissionsDenied}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
