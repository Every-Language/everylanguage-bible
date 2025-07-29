import {
  createAudioPlayer,
  setAudioModeAsync,
  AudioPlayer,
  AudioSource,
  AudioStatus,
} from 'expo-audio';
import { logger } from '@/shared/utils/logger';
import {
  validateAudioFile,
  retryAudioLoad,
  truncateTime,
  sanitizeTime,
} from '../utils/audioUtils';
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

export type AudioServiceEvent =
  | { type: 'stateChanged'; state: AudioServiceState }
  | { type: 'trackEnded' }
  | { type: 'error'; error: string };

export type AudioServiceEventListener = (event: AudioServiceEvent) => void;

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
  private progressInterval: ReturnType<typeof setTimeout> | null = null;
  private currentTrack: MediaTrack | null = null;
  private loadingPromise: Promise<void> | null = null;
  private isDisposed = false;
  private listeners: Set<AudioServiceEventListener> = new Set();

  constructor() {
    this.setupAudioMode();
  }

  /**
   * Subscribe to audio service events
   */
  subscribe(listener: AudioServiceEventListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: AudioServiceEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Error in audio service listener:', error);
      }
    });
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
    } catch (error) {
      logger.error('Failed to configure audio mode:', error);
    }
  }

  /**
   * Get current state
   */
  getState(): AudioServiceState {
    return { ...this.state };
  }

  /**
   * Get current track
   */
  getCurrentTrack(): MediaTrack | null {
    return this.currentTrack ? { ...this.currentTrack } : null;
  }

  /**
   * Check if audio is loaded
   */
  isLoaded(): boolean {
    return this.state.isLoaded && !this.isDisposed;
  }

  /**
   * Check if audio is playing
   */
  isPlaying(): boolean {
    return this.state.isPlaying && this.state.isLoaded && !this.isDisposed;
  }

  /**
   * Check if audio is loading
   */
  isLoading(): boolean {
    return this.state.isLoading && !this.isDisposed;
  }

  /**
   * Get current position
   */
  getPosition(): number {
    return this.state.position;
  }

  /**
   * Get duration
   */
  getDuration(): number {
    return this.state.duration;
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
          onRetry: (attempt, error) => {
            logger.warn(`Audio load retry ${attempt}:`, error);
          },
        }
      );

      // Ensure we start from the beginning
      if (this.player) {
        await this.player.seekTo(0);
      }

      this.setState({
        isLoaded: true,
        isLoading: false,
        error: null,
        position: 0,
      });

      logger.info('Audio loaded successfully:', {
        trackId: track.id,
        duration: this.state.duration,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load audio';
      this.setState({
        isLoading: false,
        error: errorMessage,
        isLoaded: false,
      });

      this.emit({ type: 'error', error: errorMessage });
      throw error;
    }
  }

  /**
   * Wait for player to be ready
   */
  private async waitForPlayerReady(): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Player ready timeout'));
      }, 10000); // 10 second timeout

      const checkReady = () => {
        if (this.player && this.state.isLoaded) {
          clearTimeout(timeout);
          resolve();
        } else if (this.player) {
          setTimeout(checkReady, 100);
        } else {
          clearTimeout(timeout);
          reject(new Error('Player was disposed during initialization'));
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
      await this.player.play();
      this.setState({ isPlaying: true, error: null });
      this.startProgressTracking();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to play audio';
      this.setState({ error: errorMessage });
      this.emit({ type: 'error', error: errorMessage });
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

    try {
      this.player.pause();
      this.setState({ isPlaying: false, error: null });
      this.stopProgressTracking();
    } catch (error) {
      logger.error('Failed to pause audio:', error);
    }
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

    try {
      this.player.pause();
      await this.player.seekTo(0);
      this.setState({
        isPlaying: false,
        position: 0,
        error: null,
      });
      this.stopProgressTracking();
    } catch (error) {
      logger.error('Failed to stop audio:', error);
    }
  }

  /**
   * Seek to a specific position in the audio
   */
  async seekTo(position: number): Promise<void> {
    if (!this.player || !this.state.isLoaded) {
      return;
    }

    const sanitizedPosition = sanitizeTime(position);
    const truncatedPosition = truncateTime(sanitizedPosition, 1);
    const clampedPosition = Math.max(
      0,
      Math.min(truncatedPosition, this.state.duration)
    );

    try {
      await this.player.seekTo(clampedPosition);
      this.setState({ position: clampedPosition });
    } catch (error) {
      logger.error('Failed to seek audio:', error);
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    if (!this.player || !this.state.isLoaded) {
      return;
    }

    const clampedVolume = Math.max(0, Math.min(1, volume));

    try {
      this.player.volume = clampedVolume;
      this.setState({ volume: clampedVolume });
    } catch (error) {
      logger.error('Failed to set volume:', error);
    }
  }

  /**
   * Set playback rate (0.25 to 4.0)
   */
  async setPlaybackRate(rate: number): Promise<void> {
    if (!this.player || !this.state.isLoaded) {
      return;
    }

    const clampedRate = Math.max(0.25, Math.min(4, rate));

    try {
      this.player.playbackRate = clampedRate;
      this.setState({ playbackRate: clampedRate });
    } catch (error) {
      logger.error('Failed to set playback rate:', error);
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
    } catch (error) {
      logger.error('Failed to set muted state:', error);
    }
  }

  /**
   * Handle playback status updates
   */
  private onPlaybackStatusUpdate(status: AudioStatus) {
    if (!status) return;

    // Sanitize and truncate time values to standard decimal places
    const sanitizedPosition = sanitizeTime(status.currentTime || 0);
    const sanitizedDuration = sanitizeTime(status.duration || 0);
    const truncatedPosition = truncateTime(sanitizedPosition, 1);
    const truncatedDuration = truncateTime(sanitizedDuration, 1);

    const updates: Partial<AudioServiceState> = {
      position: truncatedPosition,
      duration: truncatedDuration,
      isPlaying: status.playing || false,
      isLoaded: status.isLoaded || false,
    };

    this.setState(updates);

    // Handle track end
    if (status.didJustFinish) {
      this.emit({ type: 'trackEnded' });
    }
  }

  /**
   * Start progress tracking
   */
  private startProgressTracking() {
    this.stopProgressTracking();
    this.progressInterval = setInterval(() => {
      if (this.player && this.state.isPlaying) {
        const rawPosition = this.player.currentTime;
        const sanitizedPosition = sanitizeTime(rawPosition);
        const truncatedPosition = truncateTime(sanitizedPosition, 1);

        // Only update if position has actually changed significantly
        if (Math.abs(truncatedPosition - this.state.position) >= 0.1) {
          this.setState({ position: truncatedPosition });
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
   * Update internal state and emit change event
   */
  private setState(updates: Partial<AudioServiceState>) {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // Only emit if state actually changed
    if (JSON.stringify(previousState) !== JSON.stringify(this.state)) {
      this.emit({ type: 'stateChanged', state: this.state });
    }
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
      } catch (error) {
        logger.error('Error unloading audio:', error);
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
    this.listeners.clear();

    try {
      await this.stop();
      await this.unloadAudio();
    } catch (error) {
      logger.error('Error disposing audio service:', error);
    }
  }

  /**
   * Force stop all audio (emergency cleanup)
   */
  async forceStop(): Promise<void> {
    this.isDisposed = true;
    this.listeners.clear();

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    if (this.player) {
      try {
        this.player.pause();
        this.player.removeAllListeners('playbackStatusUpdate');
      } catch (error) {
        logger.error('Error force stopping audio:', error);
      }
      this.player = null;
    }

    this.state = {
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
  }
}

// Singleton instance
export const audioService = new AudioService();
