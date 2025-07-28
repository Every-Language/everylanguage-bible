import {
  createAudioPlayer,
  setAudioModeAsync,
  AudioPlayer,
  AudioSource,
} from 'expo-audio';
import { logger } from '@/shared/utils/logger';
import { validateAudioFile, retryAudioLoad } from '../utils/audioUtils';
import { MediaTrack } from '../types';

export interface AudioServiceState {
  isLoaded: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  duration: number;
  position: number;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
}

export interface AudioServiceCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onLoad?: (duration: number) => void;
  onError?: (error: string) => void;
  onProgress?: (position: number) => void;
  onEnd?: () => void;
}

export class AudioService {
  private player: AudioPlayer | null = null;
  private state: AudioServiceState = {
    isLoaded: false,
    isPlaying: false,
    isLoading: false,
    error: null,
    duration: 0,
    position: 0,
    volume: 1.0,
    playbackRate: 1.0,
    isMuted: false,
  };
  private callbacks: AudioServiceCallbacks = {};
  private progressInterval: ReturnType<typeof setTimeout> | null = null;
  private currentTrack: MediaTrack | null = null;
  private loadingPromise: Promise<void> | null = null; // Prevent race conditions
  private isDisposed = false;

  constructor() {
    this.setupAudioMode();
  }

  /**
   * Set up audio mode for background playback
   */
  private async setupAudioMode() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
        allowsRecording: false,
        interruptionMode: 'duckOthers',
        interruptionModeAndroid: 'duckOthers',
      });
      // logger.info('Audio mode configured successfully');
    } catch {
      // logger.error('Failed to configure audio mode:', _error);
    }
  }

  /**
   * Get current state
   */
  getState(): AudioServiceState {
    return { ...this.state };
  }

  /**
   * Set callbacks for audio events
   */
  setCallbacks(callbacks: AudioServiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Load an audio file from local path
   */
  async loadAudio(track: MediaTrack): Promise<void> {
    if (!track.url) {
      throw new Error('Track URL is required');
    }

    // Prevent race conditions - if already loading, wait for current operation
    if (this.loadingPromise) {
      await this.loadingPromise;
    }

    // If this is the same track and already loaded, just return
    if (this.currentTrack?.id === track.id && this.state.isLoaded) {
      logger.info('Track already loaded:', track.id);
      return;
    }

    this.loadingPromise = this._loadAudioInternal(track);
    try {
      await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Internal load audio implementation
   */
  private async _loadAudioInternal(track: MediaTrack): Promise<void> {
    if (this.isDisposed) {
      throw new Error('Audio service has been disposed');
    }

    this.setState({ isLoading: true, error: null });
    this.currentTrack = track;

    try {
      // Validate the audio file first
      const fileInfo = await validateAudioFile(track.url || '');
      if (!fileInfo.isValid) {
        throw new Error(fileInfo.error || 'Invalid audio file');
      }

      // Stop any currently playing audio and unload previous audio
      await this.stop();
      await this.unloadAudio();

      // Create audio source
      const audioSource: AudioSource = { uri: fileInfo.uri };

      // Load the new audio file with retry logic
      await retryAudioLoad(
        async () => {
          this.player = createAudioPlayer(audioSource, 100); // 100ms update interval

          // Set up event listeners
          this.player.addListener(
            'playbackStatusUpdate',
            this.onPlaybackStatusUpdate.bind(this)
          );

          // Wait for the player to be loaded
          await this.waitForPlayerReady();
        },
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          onRetry: (_attempt, _error) => {
            // logger.warn(`Audio load retry ${_attempt}:`, _error);
          },
        }
      );

      this.setState({
        isLoaded: true,
        isLoading: false,
        error: null,
      });

      this.callbacks.onLoad?.(this.state.duration);
      // logger.info('Audio loaded successfully:', {
      //   trackId: track.id,
      //   duration: this.state.duration,
      // });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load audio';
      this.setState({
        isLoading: false,
        error: errorMessage,
        isLoaded: false,
      });
      this.currentTrack = null; // Clear current track on error
      this.callbacks.onError?.(errorMessage);
      // logger.error('Failed to load audio:', { trackId: track.id, error });
      throw error;
    }
  }

  /**
   * Wait for the audio player to be ready
   */
  private async waitForPlayerReady(): Promise<void> {
    if (!this.player) {
      throw new Error('No audio player available');
    }

    return new Promise((resolve, reject) => {
      const maxWaitTime = 10000; // 10 seconds
      const checkInterval = 100; // 100ms
      let elapsedTime = 0;

      const checkReady = () => {
        if (this.player?.isLoaded) {
          resolve();
        } else if (elapsedTime >= maxWaitTime) {
          reject(new Error('Audio player failed to load within timeout'));
        } else {
          elapsedTime += checkInterval;
          setTimeout(checkReady, checkInterval);
        }
      };

      checkReady();
    });
  }

  /**
   * Play the loaded audio
   */
  async play(): Promise<void> {
    if (!this.player || !this.state.isLoaded) {
      throw new Error('No audio loaded');
    }

    if (this.isDisposed) {
      throw new Error('Audio service has been disposed');
    }

    try {
      this.player.play();
      this.setState({ isPlaying: true, error: null });
      this.startProgressTracking();
      this.callbacks.onPlay?.();
      // logger.info('Audio playback started');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to play audio';
      this.setState({ error: errorMessage });
      this.callbacks.onError?.(errorMessage);
      // logger.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Pause the audio playback
   */
  async pause(): Promise<void> {
    if (!this.player || !this.state.isLoaded) {
      return;
    }

    if (this.isDisposed) {
      return;
    }

    this.player.pause();
    this.setState({ isPlaying: false });
    this.stopProgressTracking();
    this.callbacks.onPause?.();
    // logger.info('Audio playback paused');
  }

  /**
   * Stop the audio playback and reset position
   */
  async stop(): Promise<void> {
    if (!this.player || !this.state.isLoaded) {
      return;
    }

    if (this.isDisposed) {
      return;
    }

    this.player.pause();
    await this.player.seekTo(0);
    this.setState({
      isPlaying: false,
      position: 0,
      error: null,
    });
    this.stopProgressTracking();
    this.callbacks.onStop?.();
    // logger.info('Audio playback stopped');
  }

  /**
   * Seek to a specific position in the audio
   */
  async seekTo(position: number): Promise<void> {
    if (!this.player || !this.state.isLoaded) {
      return;
    }

    const clampedPosition = Math.max(
      0,
      Math.min(position, this.state.duration)
    );
    await this.player.seekTo(clampedPosition);
    this.setState({ position: clampedPosition });
    // logger.info('Audio seeked to position:', clampedPosition);
  }

  /**
   * Set the volume (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    if (!this.player || !this.state.isLoaded) {
      return;
    }

    try {
      const clampedVolume = Math.max(0.0, Math.min(1.0, volume));
      this.player.volume = clampedVolume;
      this.setState({ volume: clampedVolume });
      // logger.info('Audio volume set to:', clampedVolume);
    } catch (error) {
      logger.error('Failed to set volume:', error);
      throw error;
    }
  }

  /**
   * Set the playback rate (0.25x to 4x)
   */
  async setPlaybackRate(rate: number): Promise<void> {
    if (!this.player || !this.state.isLoaded) {
      return;
    }

    try {
      const clampedRate = Math.max(0.25, Math.min(4.0, rate));
      this.player.playbackRate = clampedRate;
      this.setState({ playbackRate: clampedRate });
      // logger.info('Audio playback rate set to:', clampedRate);
    } catch (error) {
      logger.error('Failed to set playback rate:', error);
      throw error;
    }
  }

  /**
   * Set muted state
   */
  async setMuted(muted: boolean): Promise<void> {
    if (!this.player || !this.state.isLoaded) {
      return;
    }

    try {
      this.player.muted = muted;
      this.setState({ isMuted: muted });
      // logger.info('Audio muted state set to:', muted);
    } catch (error) {
      logger.error('Failed to set muted state:', error);
      throw error;
    }
  }

  /**
   * Get current track
   */
  getCurrentTrack(): MediaTrack | null {
    return this.currentTrack;
  }

  /**
   * Check if audio is loaded
   */
  isLoaded(): boolean {
    return (
      this.state.isLoaded && this.player?.isLoaded === true && !this.isDisposed
    );
  }

  /**
   * Check if audio is playing
   */
  isPlaying(): boolean {
    return (
      this.state.isPlaying && this.player?.playing === true && !this.isDisposed
    );
  }

  /**
   * Check if audio is currently loading
   */
  isLoading(): boolean {
    return this.state.isLoading || this.loadingPromise !== null;
  }

  /**
   * Get current position
   */
  getPosition(): number {
    return this.player?.currentTime || this.state.position;
  }

  /**
   * Get total duration
   */
  getDuration(): number {
    return this.player?.duration || this.state.duration;
  }

  /**
   * Handle playback status updates
   */
  private onPlaybackStatusUpdate(status: any) {
    if (!status) return;

    const updates: Partial<AudioServiceState> = {
      position: status.currentTime || 0,
      duration: status.duration || 0,
      isPlaying: status.playing || false,
      isLoaded: status.isLoaded || false,
    };

    this.setState(updates);

    // Call progress callback
    this.callbacks.onProgress?.(updates.position || 0);

    // Handle track end
    if (status.didJustFinish) {
      this.callbacks.onEnd?.();
    }
  }

  /**
   * Start progress tracking
   */
  private startProgressTracking() {
    this.stopProgressTracking();
    this.progressInterval = setInterval(() => {
      if (this.player && this.state.isPlaying) {
        const position = this.player.currentTime;
        // Only update if position has actually changed
        if (Math.abs(position - this.state.position) >= 0.1) {
          // Update every 100ms or when position changes by 0.1s
          this.setState({ position });
          this.callbacks.onProgress?.(position);
        }
      }
    }, 250); // Reduced frequency from 100ms to 250ms
  }

  /**
   * Stop progress tracking
   */
  private stopProgressTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Update internal state
   */
  private setState(updates: Partial<AudioServiceState>) {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Unload current audio
   */
  private async unloadAudio(): Promise<void> {
    if (this.player) {
      try {
        this.stopProgressTracking();
        this.player.removeAllListeners('playbackStatusUpdate');
        this.player = null;
      } catch {
        // logger.error('Error unloading audio:', _error);
      }
    }

    this.setState({
      isLoaded: false,
      isPlaying: false,
      isLoading: false,
      error: null,
      duration: 0,
      position: 0,
    });
  }

  /**
   * Dispose of the audio service
   */
  async dispose(): Promise<void> {
    this.isDisposed = true;
    await this.unloadAudio();
    this.currentTrack = null;
    this.loadingPromise = null;
    // logger.info('Audio service disposed');
  }

  /**
   * Force stop all audio and reset state
   */
  async forceStop(): Promise<void> {
    try {
      await this.stop();
      await this.unloadAudio();
      this.currentTrack = null;
      this.loadingPromise = null;
      // logger.info('Audio service force stopped');
    } catch {
      // logger.error('Error force stopping audio service:', _error);
    }
  }
}

// Export singleton instance
export const audioService = new AudioService();
