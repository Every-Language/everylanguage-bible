import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocation } from '@/shared/hooks/useLocation';
import { useTheme } from '@/shared/context/ThemeContext';
import { logger } from '@/shared/utils/logger';

interface LocationDisplayProps {
  showControls?: boolean;
  showAccuracy?: boolean;
  showTimestamp?: boolean;
  onLocationUpdate?: (location: any) => void;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  showControls = true,
  showAccuracy = true,
  showTimestamp = false,
  onLocationUpdate,
}) => {
  const { theme } = useTheme();
  const {
    location,
    permissionStatus,
    isEnabled,
    isGettingLocation,
    error,
    requestPermissions,
    getCurrentLocation,
    getApproximateLocation,
    getPreciseLocation,
    startLocationUpdates,
    stopLocationUpdates,
  } = useLocation();

  const [isWatching, setIsWatching] = useState(false);

  const handleRequestPermissions = async () => {
    try {
      const result = await requestPermissions();
      if (result.granted) {
        Alert.alert(
          'Location Permission Granted',
          'You can now use location features.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Location Permission Denied',
          'Some features may be limited without location access.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.error('Failed to request location permissions:', error);
      Alert.alert('Error', 'Failed to request location permissions.');
    }
  };

  const handleGetLocation = async () => {
    try {
      const locationData = await getCurrentLocation();
      if (locationData) {
        onLocationUpdate?.(locationData);
        Alert.alert(
          'Location Obtained',
          `Latitude: ${locationData.latitude.toFixed(6)}\nLongitude: ${locationData.longitude.toFixed(6)}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to get location. Please check your settings.'
        );
      }
    } catch (error) {
      logger.error('Failed to get location:', error);
      Alert.alert('Error', 'Failed to get location.');
    }
  };

  const handleStartWatching = async () => {
    try {
      const success = await startLocationUpdates(locationData => {
        onLocationUpdate?.(locationData);
      });

      if (success) {
        setIsWatching(true);
        Alert.alert(
          'Location Updates Started',
          'Location will be updated automatically.'
        );
      } else {
        Alert.alert('Error', 'Failed to start location updates.');
      }
    } catch (error) {
      logger.error('Failed to start location updates:', error);
      Alert.alert('Error', 'Failed to start location updates.');
    }
  };

  const handleStopWatching = async () => {
    try {
      await stopLocationUpdates();
      setIsWatching(false);
      Alert.alert(
        'Location Updates Stopped',
        'Location updates have been stopped.'
      );
    } catch (error) {
      logger.error('Failed to stop location updates:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatAccuracy = (accuracy: number | null) => {
    if (accuracy === null) return 'Unknown';
    return `${Math.round(accuracy)}m`;
  };

  const getStatusColor = () => {
    if (error) return theme.colors.error || '#FF0000';
    if (isGettingLocation) return theme.colors.primary;
    if (location) return theme.colors.success || '#00FF00';
    return theme.colors.textSecondary;
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isGettingLocation) return 'Getting Location...';
    if (location) return 'Location Available';
    if (!isEnabled) return 'Location Disabled';
    if (!permissionStatus.granted) return 'Permission Required';
    return 'No Location';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor() },
          ]}
        />
        <Text style={[styles.statusText, { color: theme.colors.text }]}>
          {getStatusText()}
        </Text>
        {isGettingLocation && (
          <ActivityIndicator size='small' color={theme.colors.primary} />
        )}
      </View>

      {/* Error Display */}
      {error && (
        <Text
          style={[
            styles.errorText,
            { color: theme.colors.error || '#FF0000' },
          ]}>
          {error}
        </Text>
      )}

      {/* Location Information */}
      {location && (
        <View style={styles.locationInfo}>
          <Text
            style={[
              styles.coordinateLabel,
              { color: theme.colors.textSecondary },
            ]}>
            Coordinates:
          </Text>
          <Text style={[styles.coordinateText, { color: theme.colors.text }]}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>

          {showAccuracy && location.accuracy && (
            <Text
              style={[
                styles.accuracyText,
                { color: theme.colors.textSecondary },
              ]}>
              Accuracy: {formatAccuracy(location.accuracy)}
            </Text>
          )}

          {showTimestamp && (
            <Text
              style={[
                styles.timestampText,
                { color: theme.colors.textSecondary },
              ]}>
              Updated: {formatTimestamp(location.timestamp)}
            </Text>
          )}
        </View>
      )}

      {/* Controls */}
      {showControls && (
        <View style={styles.controls}>
          {/* Permission Request */}
          {!permissionStatus.granted && permissionStatus.canAskAgain && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={handleRequestPermissions}>
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Enable Location
              </Text>
            </TouchableOpacity>
          )}

          {/* Get Location Button */}
          {permissionStatus.granted && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={handleGetLocation}
              disabled={isGettingLocation}>
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {isGettingLocation ? 'Getting...' : 'Get Location'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Watch Location Button */}
          {permissionStatus.granted && (
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isWatching
                    ? theme.colors.secondary
                    : theme.colors.primary,
                },
              ]}
              onPress={isWatching ? handleStopWatching : handleStartWatching}>
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {isWatching ? 'Stop Watching' : 'Watch Location'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Quick Location Buttons */}
          {permissionStatus.granted && (
            <View style={styles.quickButtons}>
              <TouchableOpacity
                style={[
                  styles.quickButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={getApproximateLocation}>
                <Text
                  style={[
                    styles.quickButtonText,
                    { color: theme.colors.textSecondary },
                  ]}>
                  Quick
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={getPreciseLocation}>
                <Text
                  style={[
                    styles.quickButtonText,
                    { color: theme.colors.textSecondary },
                  ]}>
                  Precise
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Permission Status */}
      <View style={styles.permissionStatus}>
        <Text
          style={[
            styles.permissionText,
            { color: theme.colors.textSecondary },
          ]}>
          Location Services: {isEnabled ? 'Enabled' : 'Disabled'}
        </Text>
        <Text
          style={[
            styles.permissionText,
            { color: theme.colors.textSecondary },
          ]}>
          Permission: {permissionStatus.granted ? 'Granted' : 'Not Granted'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  locationInfo: {
    marginBottom: 16,
  },
  coordinateLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  coordinateText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  accuracyText: {
    fontSize: 14,
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 12,
  },
  controls: {
    gap: 8,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  permissionStatus: {
    gap: 4,
  },
  permissionText: {
    fontSize: 12,
  },
});
