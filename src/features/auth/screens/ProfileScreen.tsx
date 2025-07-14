import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '@/shared/context/ThemeContext';
import { Button } from '@/shared/components/ui/Button';
import { SyncStatus } from '@/shared/components/SyncStatus';

interface ProfileScreenProps {
  onClose: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={[styles.closeButton, { color: theme.colors.primary }]}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {user && (
          <>
            <View style={[styles.userInfo, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{user?.email}</Text>
            </View>

            <View style={[styles.userInfo, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>User ID</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{user?.id}</Text>
            </View>

            <View style={[styles.userInfo, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Status</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </>
        )}

        {/* Sync Status Section */}
        <View style={styles.syncSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Data Sync
          </Text>
          <SyncStatus showDetails={true} />
        </View>

        <View style={styles.buttonContainer}>
          {user ? (
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="outline"
              size="lg"
            />
          ) : (
            <Text style={[styles.guestText, { color: theme.colors.textSecondary }]}>
              Sign in to sync your data across devices
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '400',
  },
  syncSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 32,
  },
  guestText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 