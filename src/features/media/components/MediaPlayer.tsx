import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';

// Using simple text icons for now - you can replace with icon libraries later
const Icons = {
  skipPrevious: '⏮',
  rewind: '⏪',
  play: '▶',
  pause: '⏸',
  fastForward: '⏩',
  skipNext: '⏭',
  info: 'ⓘ',
};

export const MediaPlayer: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.trackInfo}>
        <Text style={[styles.trackTitle, { color: theme.colors.text }]}>
          John Chapter 1
        </Text>
        <Text style={[styles.trackSubtitle, { color: theme.colors.textSecondary }]}>
          ENGLISH - BSB
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { backgroundColor: theme.colors.primary, width: '30%' }
            ]} 
          />
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
            0:31
          </Text>
          <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
            1:09
          </Text>
        </View>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={[styles.controlIcon, { color: theme.colors.text }]}>
            {Icons.skipPrevious}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Text style={[styles.controlIcon, { color: theme.colors.text }]}>
            {Icons.rewind}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.playButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.playIcon, { color: theme.colors.textInverse }]}>
            {Icons.play}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Text style={[styles.controlIcon, { color: theme.colors.text }]}>
            {Icons.fastForward}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Text style={[styles.controlIcon, { color: theme.colors.text }]}>
            {Icons.skipNext}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Text style={[styles.controlIcon, { color: theme.colors.text }]}>
            {Icons.info}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackSubtitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 20,
  },
  playIcon: {
    fontSize: 24,
    marginLeft: 2, // Center the play icon
  },
}); 