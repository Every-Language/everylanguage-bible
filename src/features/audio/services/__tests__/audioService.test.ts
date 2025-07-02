/**
 * Audio Service Tests
 *
 * TDD tests for the core audio service that handles Expo Audio integration.
 * These tests define the expected behavior before implementation.
 *
 * @since 1.0.0
 */

/**
 * 🎭 MOCK SETUP: Feature-First Mocking
 *
 * Following feature-first development, our mock is located at:
 * src/features/audio/services/__tests__/__mocks__/expo-audio.js
 *
 * This approach keeps all testing infrastructure within the feature folder.
 */
jest.mock('expo-audio');

// Import mocked functions for test assertions
import { AudioModule, createAudioPlayer } from 'expo-audio';
import { AudioTrack } from '../../types';
// @ts-expect-error - importing audioService from file
import { audioService } from '../audioService';

// TypeScript: Cast to jest.MockedFunction for proper typing
const mockAudioModule = AudioModule as jest.Mocked<typeof AudioModule>;
const mockCreateAudioPlayer = createAudioPlayer as jest.MockedFunction<
  typeof createAudioPlayer
>;

// Sample test data
const mockAudioTrack: AudioTrack = {
  id: 'track-1',
  chapter_id: 'chapter-1',
  language_entity_id: 'lang-1',
  url: 'https://example.com/audio.mp3',
  duration: 300, // 5 minutes
  file_size: 5000000, // 5MB
  quality: 'medium',
  format: 'mp3',
  bitrate: 128,
  is_downloaded: false,
  narrator: {
    name: 'John Doe',
    gender: 'male',
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('audioService', () => {
  beforeEach(() => {
    // 🧹 CLEANUP: Reset all mocks to fresh state before each test
    jest.clearAllMocks();

    // Mocks are already properly configured in __mocks__/expo-audio.js
    // No need to reconfigure them here - Jest will use the mock file
  });

  describe('initialization', () => {
    it('should initialize audio mode for background playback', async () => {
      await audioService.initialize();

      expect(mockAudioModule.setAudioModeAsync).toHaveBeenCalledWith({
        shouldPlayInBackground: true,
        playsInSilentMode: true,
        allowsRecording: false,
        shouldRouteThroughEarpiece: false,
      });
    });

    it('should handle initialization errors gracefully', async () => {
      mockAudioModule.setAudioModeAsync.mockRejectedValueOnce(
        new Error('Init failed')
      );

      await expect(audioService.initialize()).rejects.toThrow('Init failed');
    });
  });

  describe('loadTrack', () => {
    it('should load audio track successfully', async () => {
      // Use the mock that's already configured in __mocks__/expo-audio.js
      const result = await audioService.loadTrack(mockAudioTrack);

      expect(mockCreateAudioPlayer).toHaveBeenCalledWith(mockAudioTrack.url);
      expect(result.isLoaded).toBe(true);
      expect(result.durationMillis).toBe(300000);
    });

    it('should handle network errors when loading remote tracks', async () => {
      mockCreateAudioPlayer.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      const result = await audioService.loadTrack(mockAudioTrack);

      expect(result.isLoaded).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should prioritize local files over remote URLs', async () => {
      const localTrack = {
        ...mockAudioTrack,
        local_path: 'file://local/audio.mp3',
      };

      await audioService.loadTrack(localTrack);

      expect(mockCreateAudioPlayer).toHaveBeenCalledWith(localTrack.local_path);
    });
  });

  describe('playback controls', () => {
    it('should play audio successfully', async () => {
      const mockSound = {
        playAsync: jest.fn().mockResolvedValueOnce({}),
        getStatusAsync: jest.fn().mockResolvedValueOnce({
          isLoaded: true,
          isPlaying: true,
        }),
      };

      const result = await audioService.play(mockSound);

      expect(mockSound.playAsync).toHaveBeenCalled();
      expect(result.isPlaying).toBe(true);
    });

    it('should pause audio successfully', async () => {
      const mockSound = {
        pauseAsync: jest.fn().mockResolvedValueOnce({}),
        getStatusAsync: jest.fn().mockResolvedValueOnce({
          isLoaded: true,
          isPlaying: false,
        }),
      };

      const result = await audioService.pause(mockSound);

      expect(mockSound.pauseAsync).toHaveBeenCalled();
      expect(result.isPlaying).toBe(false);
    });

    it('should stop audio and reset position', async () => {
      const mockSound = {
        stopAsync: jest.fn().mockResolvedValueOnce({}),
        setPositionAsync: jest.fn().mockResolvedValueOnce({}),
        getStatusAsync: jest.fn().mockResolvedValueOnce({
          isLoaded: true,
          isPlaying: false,
          positionMillis: 0,
        }),
      };

      const result = await audioService.stop(mockSound);

      expect(mockSound.stopAsync).toHaveBeenCalled();
      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
      expect(result.positionMillis).toBe(0);
    });
  });

  describe('seeking', () => {
    it('should seek to specific position', async () => {
      const mockSound = {
        setPositionAsync: jest.fn().mockResolvedValueOnce({}),
        // Note: getStatusAsync is called twice in seekTo (for clamping + return value)
        getStatusAsync: jest
          .fn()
          .mockResolvedValueOnce({
            // First call: for duration clamping
            isLoaded: true,
            durationMillis: 300000, // 5 minutes
          })
          .mockResolvedValueOnce({
            // Second call: for return value
            isLoaded: true,
            positionMillis: 60000, // 1 minute
          }),
      };

      const result = await audioService.seekTo(mockSound, 60); // 60 seconds

      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(60000);
      expect(result.positionMillis).toBe(60000);
    });

    it('should clamp seek position to valid range', async () => {
      const mockSound = {
        setPositionAsync: jest.fn().mockResolvedValueOnce({}),
        getStatusAsync: jest.fn().mockResolvedValueOnce({
          isLoaded: true,
          positionMillis: 0,
          durationMillis: 300000,
        }),
      };

      // Try to seek beyond duration
      await audioService.seekTo(mockSound, 400); // 400 seconds, beyond 300s duration

      // Should clamp to duration
      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(300000);
    });
  });

  describe('playback speed', () => {
    it('should set playback rate', async () => {
      const mockSound = {
        setRateAsync: jest.fn().mockResolvedValueOnce({}),
        getStatusAsync: jest.fn().mockResolvedValueOnce({
          isLoaded: true,
          rate: 1.5,
        }),
      };

      const result = await audioService.setPlaybackRate(mockSound, 1.5);

      expect(mockSound.setRateAsync).toHaveBeenCalledWith(1.5, true); // true for pitch correction
      expect(result.rate).toBe(1.5);
    });

    it('should clamp playback rate to valid range', async () => {
      const mockSound = {
        setRateAsync: jest.fn().mockResolvedValueOnce({}),
        getStatusAsync: jest.fn().mockResolvedValueOnce({
          isLoaded: true,
          rate: 2.0,
        }),
      };

      // Try to set rate beyond maximum
      await audioService.setPlaybackRate(mockSound, 3.0);

      // Should clamp to maximum (2.0)
      expect(mockSound.setRateAsync).toHaveBeenCalledWith(2.0, true);
    });
  });

  describe('volume controls', () => {
    it('should set volume', async () => {
      const mockSound = {
        setVolumeAsync: jest.fn().mockResolvedValueOnce({}),
        getStatusAsync: jest.fn().mockResolvedValueOnce({
          isLoaded: true,
          volume: 0.5,
        }),
      };

      const result = await audioService.setVolume(mockSound, 0.5);

      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.5);
      expect(result.volume).toBe(0.5);
    });

    it('should clamp volume to valid range (0-1)', async () => {
      const mockSound = {
        setVolumeAsync: jest.fn().mockResolvedValueOnce({}),
        getStatusAsync: jest.fn().mockResolvedValueOnce({
          isLoaded: true,
          volume: 1.0,
        }),
      };

      // Try to set volume beyond maximum
      await audioService.setVolume(mockSound, 1.5);

      // Should clamp to maximum (1.0)
      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(1.0);
    });
  });

  describe('error handling', () => {
    it('should handle sound loading failures', async () => {
      mockCreateAudioPlayer.mockImplementationOnce(() => {
        throw new Error('Failed to load');
      });

      const result = await audioService.loadTrack(mockAudioTrack);

      expect(result.isLoaded).toBe(false);
      expect(result.error).toBe('Failed to load');
    });

    it('should handle playback failures', async () => {
      const mockSound = {
        playAsync: jest
          .fn()
          .mockRejectedValueOnce(new Error('Playback failed')),
      };

      await expect(audioService.play(mockSound)).rejects.toThrow(
        'Playback failed'
      );
    });
  });

  describe('status monitoring', () => {
    it('should get current playback status', async () => {
      const mockSound = {
        getStatusAsync: jest.fn().mockResolvedValueOnce({
          isLoaded: true,
          isPlaying: true,
          positionMillis: 30000,
          durationMillis: 300000,
          rate: 1.0,
          volume: 1.0,
        }),
      };

      const status = await audioService.getStatus(mockSound);

      expect(status.isLoaded).toBe(true);
      expect(status.isPlaying).toBe(true);
      expect(status.positionMillis).toBe(30000);
      expect(status.durationMillis).toBe(300000);
    });
  });

  describe('cleanup', () => {
    it('should unload sound and free resources', async () => {
      const mockSound = {
        unloadAsync: jest.fn().mockResolvedValueOnce({}),
      };

      await audioService.unloadSound(mockSound);

      expect(mockSound.unloadAsync).toHaveBeenCalled();
    });
  });
});
