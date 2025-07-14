import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';

interface TopBarProps {
  title?: string;
  showProfile?: boolean;
  showThemeToggle?: boolean;
  onProfilePress?: () => void;
}

// Using simple text icons for now - you can replace with icon libraries later
const Icons = {
  profile: '👤',
  sun: '☀️',
  moon: '🌙',
  search: '🔍',
};

export const TopBar: React.FC<TopBarProps> = ({ 
  title, 
  showProfile = true, 
  showThemeToggle = true,
  onProfilePress 
}) => {
  const { theme, mode, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.leftSection}>
          {title && (
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
          )}
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={[styles.icon, { color: theme.colors.text }]}>
              {Icons.search}
            </Text>
          </TouchableOpacity>
          
          {showThemeToggle && (
            <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
              <Text style={[styles.icon, { color: theme.colors.text }]}>
                {mode === 'light' ? Icons.moon : Icons.sun}
              </Text>
            </TouchableOpacity>
          )}
          
          {showProfile && (
            <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
              <Text style={[styles.icon, { color: theme.colors.text }]}>
                {Icons.profile}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
}); 