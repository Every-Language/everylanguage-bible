import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { useAuthContext } from '@/features/auth/components/AuthProvider';
import { SlideUpModal } from './ui/SlideUpModal';
import { SyncStatusPill } from './SyncStatusPill';

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  onProfilePress?: () => void;
  onSyncPress?: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  visible,
  onClose,
  onProfilePress,
  onSyncPress,
}) => {
  const { theme, mode, toggleTheme } = useTheme();
  const { user, signOut, isLoading } = useAuthContext();

  const handleProfilePress = () => {
    onClose();
    onProfilePress?.();
  };

  const handleSyncPress = () => {
    onSyncPress?.();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <SlideUpModal
      visible={visible}
      onClose={onClose}
      snapPoints={['70%']}
      header={
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Menu
          </Text>
          <View style={styles.headerRight}>
            <SyncStatusPill onPress={handleSyncPress} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name='close'
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      }>
      <View style={styles.content}>
        {/* Auth Section */}
        {user ? (
          <View
            style={[
              styles.userContainer,
              { backgroundColor: theme.colors.surface },
            ]}>
            <View style={styles.userInfo}>
              <Ionicons
                name='person-circle'
                size={40}
                color={theme.colors.primary}
              />
              <View style={styles.userDetails}>
                <Text style={[styles.userEmail, { color: theme.colors.text }]}>
                  {user.email}
                </Text>
                <TouchableOpacity
                  onPress={handleProfilePress}
                  style={styles.profileLink}>
                  <Text
                    style={[
                      styles.profileLinkText,
                      { color: theme.colors.primary },
                    ]}>
                    View Profile
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleProfilePress}
            style={[
              styles.signInContainer,
              { backgroundColor: theme.colors.surface },
            ]}>
            <Ionicons name='log-in' size={24} color={theme.colors.primary} />
            <Text style={[styles.signInText, { color: theme.colors.text }]}>
              Sign In
            </Text>
            <Ionicons
              name='chevron-forward'
              size={16}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <View style={styles.menuItems}>
          {/* Theme Toggle */}
          <TouchableOpacity
            onPress={handleThemeToggle}
            style={[
              styles.menuItem,
              { backgroundColor: theme.colors.surface },
            ]}>
            <View style={styles.menuItemContent}>
              <Ionicons
                name={mode === 'light' ? 'sunny' : 'moon'}
                size={24}
                color={theme.colors.text}
              />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                {mode === 'light' ? 'Light Theme' : 'Dark Theme'}
              </Text>
            </View>
            <Ionicons
              name='chevron-forward'
              size={16}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Sign Out (only show if user is signed in) */}
          {user && (
            <TouchableOpacity
              onPress={handleSignOut}
              style={[
                styles.menuItem,
                { backgroundColor: theme.colors.surface },
              ]}
              disabled={isLoading}>
              <View style={styles.menuItemContent}>
                <Ionicons name='log-out' size={24} color={theme.colors.error} />
                <Text
                  style={[styles.menuItemText, { color: theme.colors.error }]}>
                  Sign Out
                </Text>
              </View>
              <Ionicons
                name='chevron-forward'
                size={16}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SlideUpModal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingTop: 16,
  },
  userContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileLink: {
    alignSelf: 'flex-start',
  },
  profileLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  menuItems: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
