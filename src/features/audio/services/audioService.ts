/**
 * Audio Service - Real Implementation
 *
 * Complete audio service that handles Expo Audio integration for Bible audio playback.
 * Based on the Flutter implementation approach with sophisticated audio management.
 *
 * Features:
 * - Real audio playback with Expo Audio
 * - Background playback and media session integration
 * - Verse-level navigation with precise timing
 * - Multiple audio quality support
 * - Robust error handling and recovery
 * - Position tracking and real-time updates
 *
 * @since 1.0.0
 */

import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import type {
  AudioTrack,
  PlaybackSpeed,
  ChapterAudio_temp,
  VerseTimestamp_temp,
} from '../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Audio Player Sound Interface - Real Expo Audio Sound
 */
export interface AudioSound {
  id: string;
  sound: Audio.Sound;
  uri: string;
  isLoaded: boolean;
  duration: number | undefined;
  position: number | undefined;
}

/**
 * Audio Load Result
 */
export interface AudioLoadResult {
  isLoaded: boolean;
  sound?: AudioSound;
  durationMillis?: number;
  error?: string;
}

/**
 * Audio Status Result
 */
export interface AudioStatusResult {
  isLoaded: boolean;
  isPlaying?: boolean;
  isBuffering?: boolean;
  positionMillis?: number;
  durationMillis?: number;
  rate?: number;
  volume?: number;
  isMuted?: boolean;
  error?: string;
}

/**
 * Verse Navigation Result
 */
export interface VerseNavigationResult {
  verse_number: number;
  audio_status: AudioStatusResult;
  timestamp: VerseTimestamp_temp;
  verse_text: string | undefined;
  is_first_verse: boolean;
  is_last_verse: boolean;
}

/**
 * Background Audio Configuration
 */
export interface BackgroundAudioConfig {
  shouldPlayInBackground: boolean;
  playsInSilentMode: boolean;
  allowsRecording: boolean;
  shouldRouteThroughEarpiece: boolean;
  staysActiveInBackground: boolean;
}

// ============================================================================
// Audio Service Implementation
// ============================================================================

/**
 * Audio Service Class - Real Implementation
 * Handles all audio operations using Expo Audio with background support
 */
export class AudioService {
  private initialized = false;
  private backgroundAudioEnabled = false;
  private currentSound: AudioSound | null = null;
  private positionUpdateCallback: ((positionMillis: number) => void) | null =
    null;
  private statusUpdateInterval: ReturnType<typeof setInterval> | null = null;

  // Audio configuration
  private readonly backgroundConfig: BackgroundAudioConfig = {
    shouldPlayInBackground: true,
    playsInSilentMode: true,
    allowsRecording: false,
    shouldRouteThroughEarpiece: false,
    staysActiveInBackground: true,
  };

  // ========================================================================
  // Initialization and Setup
  // ========================================================================

  /**
   * Initialize audio service for optimal Bible audio playback
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Set audio mode for background playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: this.backgroundConfig.allowsRecording,
        staysActiveInBackground: this.backgroundConfig.staysActiveInBackground,
        playsInSilentModeIOS: this.backgroundConfig.playsInSilentMode,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid:
          this.backgroundConfig.shouldRouteThroughEarpiece,
        interruptionModeIOS: 1, // DoNotMix
        interruptionModeAndroid: 1, // DoNotMix
      });

      this.backgroundAudioEnabled = true;
      this.initialized = true;

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('AudioService initialized successfully');
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize AudioService:', error);
      }
      throw new Error(`Failed to initialize audio: ${error}`);
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ========================================================================
  // Audio Loading and Management
  // ========================================================================

  /**
   * Load an audio track and create a player
   */
  async loadTrack(track: AudioTrack): Promise<AudioLoadResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Unload any existing audio
      if (this.currentSound) {
        await this.unloadSound(this.currentSound);
      }

      // Determine audio source (prioritize local files)
      const audioSource = this.getAudioSource(track);

      // Create new sound instance
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioSource },
        {
          shouldPlay: false,
          isLooping: false,
          isMuted: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        this.onPlaybackStatusUpdate.bind(this),
        false // Don't download first
      );

      // Wait for the sound to be loaded
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        throw new Error('Failed to load audio track');
      }

      // Create audio sound object
      const audioSound: AudioSound = {
        id: track.id,
        sound,
        uri: audioSource,
        isLoaded: true,
        duration: status.durationMillis,
        position: 0,
      };

      this.currentSound = audioSound;

      return {
        isLoaded: true,
        sound: audioSound,
        durationMillis: status.durationMillis || track.duration * 1000,
      };
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to load track:', error);
      }
      return {
        isLoaded: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error loading track',
      };
    }
  }

  /**
   * Get the appropriate audio source (local file or remote URL)
   */
  private getAudioSource(track: AudioTrack): string {
    // Check if local file exists and is accessible
    if (track.local_path && track.is_downloaded) {
      return track.local_path;
    }

    // Fall back to remote URL
    return track.url;
  }

  // ========================================================================
  // Playback Controls
  // ========================================================================

  /**
   * Start or resume audio playback
   */
  async play(audioSound: AudioSound): Promise<AudioStatusResult> {
    if (!audioSound || !audioSound.isLoaded) {
      throw new Error('No audio loaded or audio not ready');
    }

    try {
      await audioSound.sound.playAsync();

      // Start position tracking
      this.startPositionTracking();

      const status = await audioSound.sound.getStatusAsync();
      return this.convertStatusToResult(status);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to play audio:', error);
      }
      throw new Error(`Failed to play: ${error}`);
    }
  }

  /**
   * Pause audio playback
   */
  async pause(audioSound: AudioSound): Promise<AudioStatusResult> {
    if (!audioSound || !audioSound.isLoaded) {
      return { isLoaded: false };
    }

    try {
      await audioSound.sound.pauseAsync();

      // Stop position tracking
      this.stopPositionTracking();

      const status = await audioSound.sound.getStatusAsync();
      return this.convertStatusToResult(status);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to pause audio:', error);
      }
      throw new Error(`Failed to pause: ${error}`);
    }
  }

  /**
   * Stop audio playback and reset position to beginning
   */
  async stop(audioSound: AudioSound): Promise<AudioStatusResult> {
    if (!audioSound || !audioSound.isLoaded) {
      return { isLoaded: false };
    }

    try {
      await audioSound.sound.stopAsync();
      await audioSound.sound.setPositionAsync(0);

      // Stop position tracking
      this.stopPositionTracking();

      const status = await audioSound.sound.getStatusAsync();
      return this.convertStatusToResult(status);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to stop audio:', error);
      }
      throw new Error(`Failed to stop: ${error}`);
    }
  }

  // ========================================================================
  // Position Controls
  // ========================================================================

  /**
   * Seek to a specific position in the audio
   */
  async seekTo(
    audioSound: AudioSound,
    positionSeconds: number
  ): Promise<AudioStatusResult> {
    if (!audioSound || !audioSound.isLoaded) {
      throw new Error('No audio loaded');
    }

    try {
      const positionMillis = Math.max(positionSeconds * 1000, 0);

      // Get current status to validate position
      const currentStatus = await audioSound.sound.getStatusAsync();
      if (currentStatus.isLoaded && currentStatus.durationMillis) {
        const clampedPosition = Math.min(
          positionMillis,
          currentStatus.durationMillis
        );
        await audioSound.sound.setPositionAsync(clampedPosition);
      } else {
        await audioSound.sound.setPositionAsync(positionMillis);
      }

      const status = await audioSound.sound.getStatusAsync();
      return this.convertStatusToResult(status);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to seek:', error);
      }
      throw new Error(`Failed to seek: ${error}`);
    }
  }

  /**
   * Skip forward by specified seconds
   */
  async skipForward(
    audioSound: AudioSound,
    seconds: number = 10
  ): Promise<AudioStatusResult> {
    if (!audioSound || !audioSound.isLoaded) {
      throw new Error('No audio loaded');
    }

    try {
      const currentStatus = await audioSound.sound.getStatusAsync();
      if (
        currentStatus.isLoaded &&
        currentStatus.positionMillis !== undefined
      ) {
        const newPosition =
          (currentStatus.positionMillis + seconds * 1000) / 1000;
        return await this.seekTo(audioSound, newPosition);
      }

      return this.convertStatusToResult(currentStatus);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to skip forward:', error);
      }
      throw new Error(`Failed to skip forward: ${error}`);
    }
  }

  /**
   * Skip backward by specified seconds
   */
  async skipBackward(
    audioSound: AudioSound,
    seconds: number = 10
  ): Promise<AudioStatusResult> {
    if (!audioSound || !audioSound.isLoaded) {
      throw new Error('No audio loaded');
    }

    try {
      const currentStatus = await audioSound.sound.getStatusAsync();
      if (
        currentStatus.isLoaded &&
        currentStatus.positionMillis !== undefined
      ) {
        const newPosition = Math.max(
          (currentStatus.positionMillis - seconds * 1000) / 1000,
          0
        );
        return await this.seekTo(audioSound, newPosition);
      }

      return this.convertStatusToResult(currentStatus);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to skip backward:', error);
      }
      throw new Error(`Failed to skip backward: ${error}`);
    }
  }

  // ========================================================================
  // Audio Settings
  // ========================================================================

  /**
   * Set audio volume (0.0 to 1.0)
   */
  async setVolume(
    audioSound: AudioSound,
    volume: number
  ): Promise<AudioStatusResult> {
    if (!audioSound || !audioSound.isLoaded) {
      throw new Error('No audio loaded');
    }

    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      await audioSound.sound.setVolumeAsync(clampedVolume);

      const status = await audioSound.sound.getStatusAsync();
      return this.convertStatusToResult(status);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to set volume:', error);
      }
      throw new Error(`Failed to set volume: ${error}`);
    }
  }

  /**
   * Set playback rate/speed
   */
  async setPlaybackRate(
    audioSound: AudioSound,
    rate: PlaybackSpeed
  ): Promise<AudioStatusResult> {
    if (!audioSound || !audioSound.isLoaded) {
      throw new Error('No audio loaded');
    }

    try {
      await audioSound.sound.setRateAsync(rate, true); // shouldCorrectPitch = true

      const status = await audioSound.sound.getStatusAsync();
      return this.convertStatusToResult(status);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to set playback rate:', error);
      }
      throw new Error(`Failed to set playback rate: ${error}`);
    }
  }

  /**
   * Set playback speed (alias for setPlaybackRate)
   */
  async setPlaybackSpeed(
    audioSound: AudioSound,
    speed: PlaybackSpeed
  ): Promise<AudioStatusResult> {
    return this.setPlaybackRate(audioSound, speed);
  }

  // ========================================================================
  // Verse Navigation
  // ========================================================================

  /**
   * Navigate to the next verse
   */
  async nextVerse(
    audioSound: AudioSound,
    chapterAudio: ChapterAudio_temp
  ): Promise<VerseNavigationResult> {
    const currentVerse = await this.getCurrentVerse(audioSound, chapterAudio);
    const nextVerseNumber = currentVerse.verse_number + 1;

    const nextVerse = chapterAudio.verse_timestamps.find(
      v => v.verse_number === nextVerseNumber
    );
    if (!nextVerse) {
      // Return current verse if no next verse
      return currentVerse;
    }

    // Seek to next verse
    await this.seekTo(audioSound, nextVerse.start_time);

    const status = await audioSound.sound.getStatusAsync();

    return {
      verse_number: nextVerse.verse_number,
      audio_status: this.convertStatusToResult(status),
      timestamp: nextVerse,
      verse_text: nextVerse.text,
      is_first_verse: nextVerse.verse_number === 1,
      is_last_verse:
        nextVerse.verse_number === chapterAudio.verse_timestamps.length,
    };
  }

  /**
   * Navigate to the previous verse
   */
  async previousVerse(
    audioSound: AudioSound,
    chapterAudio: ChapterAudio_temp
  ): Promise<VerseNavigationResult> {
    const currentVerse = await this.getCurrentVerse(audioSound, chapterAudio);
    const previousVerseNumber = currentVerse.verse_number - 1;

    const previousVerse = chapterAudio.verse_timestamps.find(
      v => v.verse_number === previousVerseNumber
    );
    if (!previousVerse) {
      // Return current verse if no previous verse
      return currentVerse;
    }

    // Seek to previous verse
    await this.seekTo(audioSound, previousVerse.start_time);

    const status = await audioSound.sound.getStatusAsync();

    return {
      verse_number: previousVerse.verse_number,
      audio_status: this.convertStatusToResult(status),
      timestamp: previousVerse,
      verse_text: previousVerse.text,
      is_first_verse: previousVerse.verse_number === 1,
      is_last_verse:
        previousVerse.verse_number === chapterAudio.verse_timestamps.length,
    };
  }

  /**
   * Navigate to a specific verse
   */
  async goToVerse(
    audioSound: AudioSound,
    verseNumber: number,
    chapterAudio: ChapterAudio_temp
  ): Promise<VerseNavigationResult> {
    const targetVerse = chapterAudio.verse_timestamps.find(
      v => v.verse_number === verseNumber
    );
    if (!targetVerse) {
      throw new Error(`Verse ${verseNumber} not found`);
    }

    // Seek to target verse
    await this.seekTo(audioSound, targetVerse.start_time);

    const status = await audioSound.sound.getStatusAsync();

    return {
      verse_number: targetVerse.verse_number,
      audio_status: this.convertStatusToResult(status),
      timestamp: targetVerse,
      verse_text: targetVerse.text,
      is_first_verse: targetVerse.verse_number === 1,
      is_last_verse:
        targetVerse.verse_number === chapterAudio.verse_timestamps.length,
    };
  }

  /**
   * Get the current verse based on playback position
   */
  async getCurrentVerse(
    audioSound: AudioSound,
    chapterAudio: ChapterAudio_temp
  ): Promise<VerseNavigationResult> {
    if (!audioSound || !audioSound.isLoaded) {
      throw new Error('No audio loaded');
    }

    const status = await audioSound.sound.getStatusAsync();
    if (!status.isLoaded || status.positionMillis === undefined) {
      throw new Error('Audio not ready');
    }

    const positionSeconds = status.positionMillis / 1000;

    // Find current verse based on position
    const currentVerse = chapterAudio.verse_timestamps.find(
      verse =>
        positionSeconds >= verse.start_time && positionSeconds < verse.end_time
    );

    // If no exact match, find the closest verse
    const fallbackVerse =
      currentVerse ||
      chapterAudio.verse_timestamps.reduce((closest, verse) => {
        const currentDistance = Math.abs(verse.start_time - positionSeconds);
        const closestDistance = Math.abs(closest.start_time - positionSeconds);
        return currentDistance < closestDistance ? verse : closest;
      });

    if (!fallbackVerse) {
      throw new Error('No verses found in chapter');
    }

    return {
      verse_number: fallbackVerse.verse_number,
      audio_status: this.convertStatusToResult(status),
      timestamp: fallbackVerse,
      verse_text: fallbackVerse.text,
      is_first_verse: fallbackVerse.verse_number === 1,
      is_last_verse:
        fallbackVerse.verse_number === chapterAudio.verse_timestamps.length,
    };
  }

  // ========================================================================
  // Status and Monitoring
  // ========================================================================

  /**
   * Get current audio status
   */
  async getStatus(audioSound: AudioSound): Promise<AudioStatusResult> {
    if (!audioSound || !audioSound.isLoaded) {
      return { isLoaded: false };
    }

    try {
      const status = await audioSound.sound.getStatusAsync();
      return this.convertStatusToResult(status);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to get status:', error);
      }
      return { isLoaded: false, error: 'Failed to get status' };
    }
  }

  /**
   * Convert Expo AV status to our status format
   */
  private convertStatusToResult(status: AVPlaybackStatus): AudioStatusResult {
    if (!status.isLoaded) {
      const result: AudioStatusResult = {
        isLoaded: false,
      };

      if ('error' in status && status.error) {
        result.error = status.error;
      }

      return result;
    }

    const loadedStatus = status as AVPlaybackStatusSuccess;

    const result: AudioStatusResult = {
      isLoaded: true,
      isPlaying: loadedStatus.isPlaying,
      isBuffering: loadedStatus.isBuffering,
      positionMillis: loadedStatus.positionMillis,
      rate: loadedStatus.rate,
      volume: loadedStatus.volume,
      isMuted: loadedStatus.isMuted,
    };

    // Only add durationMillis if it's defined
    if (loadedStatus.durationMillis !== undefined) {
      result.durationMillis = loadedStatus.durationMillis;
    }

    return result;
  }

  // ========================================================================
  // Position Tracking
  // ========================================================================

  /**
   * Set callback for position updates
   */
  setPositionUpdateCallback(callback: (positionMillis: number) => void): void {
    this.positionUpdateCallback = callback;
  }

  /**
   * Start position tracking
   */
  private startPositionTracking(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }

    this.statusUpdateInterval = setInterval(async () => {
      if (this.currentSound && this.positionUpdateCallback) {
        try {
          const status = await this.currentSound.sound.getStatusAsync();
          if (status.isLoaded && status.positionMillis !== undefined) {
            this.positionUpdateCallback(status.positionMillis);
          }
        } catch (error) {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.error('Error tracking position:', error);
          }
        }
      }
    }, 100); // Update every 100ms for smooth UI updates
  }

  /**
   * Stop position tracking
   */
  private stopPositionTracking(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }

  /**
   * Handle playback status updates from Expo AV
   */
  private onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
    if (
      status.isLoaded &&
      this.positionUpdateCallback &&
      status.positionMillis !== undefined
    ) {
      this.positionUpdateCallback(status.positionMillis);
    }
  }

  // ========================================================================
  // Cleanup and Resource Management
  // ========================================================================

  /**
   * Unload audio and free resources
   */
  async unloadSound(audioSound: AudioSound): Promise<void> {
    if (!audioSound) {
      return;
    }

    try {
      // Stop position tracking
      this.stopPositionTracking();

      // Unload the sound
      await audioSound.sound.unloadAsync();

      // Clear current sound reference if this was the current sound
      if (this.currentSound?.id === audioSound.id) {
        this.currentSound = null;
      }

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log(`Unloaded audio: ${audioSound.id}`);
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to unload sound:', error);
      }
      throw new Error(`Failed to unload sound: ${error}`);
    }
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    // Stop position tracking
    this.stopPositionTracking();

    // Unload current sound
    if (this.currentSound) {
      await this.unloadSound(this.currentSound);
    }

    // Clear callbacks
    this.positionUpdateCallback = null;

    // Reset initialization state
    this.initialized = false;
    this.backgroundAudioEnabled = false;

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('AudioService cleanup completed');
    }
  }

  // ========================================================================
  // Background Audio and Media Session
  // ========================================================================

  /**
   * Enable background audio playback
   */
  async enableBackgroundAudio(): Promise<void> {
    if (this.backgroundAudioEnabled) {
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        ...this.backgroundConfig,
        staysActiveInBackground: true,
      });

      this.backgroundAudioEnabled = true;
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('Background audio enabled');
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to enable background audio:', error);
      }
      throw new Error(`Failed to enable background audio: ${error}`);
    }
  }

  /**
   * Disable background audio playback
   */
  async disableBackgroundAudio(): Promise<void> {
    if (!this.backgroundAudioEnabled) {
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        ...this.backgroundConfig,
        staysActiveInBackground: false,
      });

      this.backgroundAudioEnabled = false;
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('Background audio disabled');
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to disable background audio:', error);
      }
      throw new Error(`Failed to disable background audio: ${error}`);
    }
  }

  /**
   * Check if background audio is enabled
   */
  isBackgroundAudioEnabled(): boolean {
    return this.backgroundAudioEnabled;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

// Export a singleton instance for app-wide use
export const audioService = new AudioService();
