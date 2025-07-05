/**
 * expo-audio Mock for Jest Testing
 *
 * Feature-first mock implementation for expo-audio module.
 * This mock stays within the audio feature folder to maintain
 * feature-first development principles.
 *
 * @since 1.0.0
 */

// Mock AudioModule
export const AudioModule = {
  setAudioModeAsync: jest.fn(async () => ({})),
  getRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })),
};

// Mock createAudioPlayer function
export const createAudioPlayer = jest.fn(() => ({
  id: 1,
  duration: 300,
  currentTime: 0,
  isLoaded: true,
  playing: false,
  // Mock audio player methods
  playAsync: jest.fn(async () => ({})),
  pauseAsync: jest.fn(async () => ({})),
  stopAsync: jest.fn(async () => ({})),
  setPositionAsync: jest.fn(async () => ({})),
  setRateAsync: jest.fn(async () => ({})),
  setVolumeAsync: jest.fn(async () => ({})),
  getStatusAsync: jest.fn(async () => ({
    isLoaded: true,
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 300000,
    rate: 1.0,
    volume: 1.0,
    isMuted: false,
  })),
  unloadAsync: jest.fn(async () => ({})),
}));

// Default export for compatibility
export default {
  AudioModule,
  createAudioPlayer,
};
