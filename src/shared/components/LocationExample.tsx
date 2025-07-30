import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LocationDisplay } from './LocationDisplay';
import { useLocation } from '@/shared/hooks/useLocation';
import { useTheme } from '@/shared/hooks';
import { LocationData } from '@/shared/services/location/LocationService';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';

export const LocationExample: React.FC = () => {
  const { theme } = useTheme();
  const { location, calculateDistance, isLocationWithinRadius } = useLocation();
  const handleLocationUpdate = (_locationData: LocationData) => {
    // Location update handled silently
  };

  // Example: Check if user is near a specific location (e.g., a church)
  const churchLocation = { latitude: 40.7128, longitude: -74.006 }; // Example coordinates
  const isNearChurch = location
    ? isLocationWithinRadius(
        churchLocation.latitude,
        churchLocation.longitude,
        1000
      )
    : false;

  // Example: Calculate distance to a specific point
  const distanceToChurch = location
    ? calculateDistance(
        location.latitude,
        location.longitude,
        churchLocation.latitude,
        churchLocation.longitude
      )
    : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Location Features Example
      </Text>

      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        This example shows how to use location features in the Bible app for
        region-specific content and language recommendations.
      </Text>

      {/* Location Display Component */}
      <LocationDisplay
        showControls={true}
        showAccuracy={true}
        showTimestamp={true}
        onLocationUpdate={handleLocationUpdate}
      />

      {/* Location-based Features */}
      {location && (
        <View
          style={[
            styles.featuresContainer,
            { backgroundColor: theme.colors.surface },
          ]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Location-Based Features
          </Text>

          {/* Distance to Church */}
          {distanceToChurch && (
            <View style={styles.featureItem}>
              <Text
                style={[
                  styles.featureLabel,
                  { color: theme.colors.textSecondary },
                ]}>
                Distance to Example Church:
              </Text>
              <Text style={[styles.featureValue, { color: theme.colors.text }]}>
                {Math.round(distanceToChurch)} meters
              </Text>
            </View>
          )}

          {/* Near Church Status */}
          <View style={styles.featureItem}>
            <Text
              style={[
                styles.featureLabel,
                { color: theme.colors.textSecondary },
              ]}>
              Near Example Church:
            </Text>
            <Text
              style={[
                styles.featureValue,
                {
                  color: isNearChurch
                    ? theme.colors.success || '#00FF00'
                    : theme.colors.textSecondary,
                },
              ]}>
              {isNearChurch ? 'Yes' : 'No'}
            </Text>
          </View>

          {/* Region Detection */}
          <View style={styles.featureItem}>
            <Text
              style={[
                styles.featureLabel,
                { color: theme.colors.textSecondary },
              ]}>
              Detected Region:
            </Text>
            <Text style={[styles.featureValue, { color: theme.colors.text }]}>
              {location.latitude > 0
                ? 'Northern Hemisphere'
                : 'Southern Hemisphere'}
            </Text>
          </View>

          {/* Language Recommendations */}
          <View style={styles.featureItem}>
            <Text
              style={[
                styles.featureLabel,
                { color: theme.colors.textSecondary },
              ]}>
              Suggested Languages:
            </Text>
            <Text style={[styles.featureValue, { color: theme.colors.text }]}>
              {location.latitude > 40
                ? 'English, Spanish'
                : 'Portuguese, French'}
            </Text>
          </View>
        </View>
      )}

      {/* Usage Examples */}
      <View
        style={[
          styles.examplesContainer,
          { backgroundColor: theme.colors.surface },
        ]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Usage Examples
        </Text>

        <Text
          style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
          • Region-specific Bible content based on location
        </Text>
        <Text
          style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
          • Language recommendations for local dialects
        </Text>
        <Text
          style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
          • Distance-based content filtering
        </Text>
        <Text
          style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
          • Location-aware analytics for ministry insights
        </Text>
        <Text
          style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
          • Geofencing for special content delivery
        </Text>
      </View>

      {/* Privacy Notice */}
      <View
        style={[
          styles.privacyContainer,
          { backgroundColor: theme.colors.surface },
        ]}>
        <Text style={[styles.privacyTitle, { color: theme.colors.text }]}>
          Privacy & Security
        </Text>
        <Text
          style={[styles.privacyText, { color: theme.colors.textSecondary }]}>
          Your location is used only to provide better Bible content and
          language recommendations. Location data is not stored permanently and
          is not shared with third parties.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_VARIATIONS.BORDER_GRAY,
  },
  featureLabel: {
    fontSize: 14,
    flex: 1,
  },
  featureValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  examplesContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  exampleText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  privacyContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
