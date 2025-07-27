import { AudioService } from '../AudioService';
import { MediaTrack } from '../../types';

// Mock expo-audio
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    isLoaded: true,
    playing: false,
    currentTime: 0,
    duration: 100,
    volume: 1.0,
    playbackRate: 1.0,
    muted: false,
  })),
  setAudioModeAsync: jest.fn(),
}));

// Mock audio utils
jest.mock('../../utils/audioUtils', () => ({
  validateAudioFile: jest.fn(() =>
    Promise.resolve({ isValid: true, uri: 'file://test.mp3' })
  ),
  retryAudioLoad: jest.fn(fn => fn()),
}));

describe('AudioService - Single Audio Playback', () => {
  let audioService: AudioService;

  beforeEach(() => {
    audioService = new AudioService();
  });

  afterEach(async () => {
    await audioService.dispose();
  });

  const createMockTrack = (id: string, url: string): MediaTrack => ({
    id,
    title: `Track ${id}`,
    subtitle: 'Test Track',
    duration: 100,
    currentTime: 0,
    isPlaying: false,
    url,
  });

  it('should ensure only one audio file is loaded at a time', async () => {
    const track1 = createMockTrack('track1', 'file://track1.mp3');
    const track2 = createMockTrack('track2', 'file://track2.mp3');

    // Load first track
    await audioService.loadAudio(track1);
    expect(audioService.getCurrentTrack()?.id).toBe('track1');
    expect(audioService.isLoaded()).toBe(true);

    // Load second track - should unload first track
    await audioService.loadAudio(track2);
    expect(audioService.getCurrentTrack()?.id).toBe('track2');
    expect(audioService.isLoaded()).toBe(true);
  });

  it('should prevent race conditions when loading multiple tracks rapidly', async () => {
    const track1 = createMockTrack('track1', 'file://track1.mp3');
    const track2 = createMockTrack('track2', 'file://track2.mp3');
    const track3 = createMockTrack('track3', 'file://track3.mp3');

    // Start multiple load operations simultaneously
    const loadPromises = [
      audioService.loadAudio(track1),
      audioService.loadAudio(track2),
      audioService.loadAudio(track3),
    ];

    await Promise.all(loadPromises);

    // Should end up with the last track loaded
    expect(audioService.getCurrentTrack()?.id).toBe('track3');
    expect(audioService.isLoaded()).toBe(true);
  });

  it('should return early if loading the same track that is already loaded', async () => {
    const track = createMockTrack('track1', 'file://track1.mp3');

    // Load track first time
    await audioService.loadAudio(track);
    const firstLoadTime = Date.now();

    // Load same track again
    await audioService.loadAudio(track);
    const secondLoadTime = Date.now();

    // Second load should be much faster (no actual loading)
    expect(secondLoadTime - firstLoadTime).toBeLessThan(100);
    expect(audioService.getCurrentTrack()?.id).toBe('track1');
  });

  it('should stop currently playing audio when loading new track', async () => {
    const track1 = createMockTrack('track1', 'file://track1.mp3');
    const track2 = createMockTrack('track2', 'file://track2.mp3');

    // Load and play first track
    await audioService.loadAudio(track1);
    await audioService.play();
    expect(audioService.isPlaying()).toBe(true);

    // Load second track - should stop first track
    await audioService.loadAudio(track2);
    expect(audioService.isPlaying()).toBe(false);
    expect(audioService.getCurrentTrack()?.id).toBe('track2');
  });

  it('should handle errors gracefully and reset state', async () => {
    const { validateAudioFile } = jest.requireMock('../../utils/audioUtils');
    validateAudioFile.mockRejectedValueOnce(new Error('File not found'));

    const track = createMockTrack('track1', 'file://invalid.mp3');

    try {
      await audioService.loadAudio(track);
    } catch {
      // Expected to throw
    }

    // State should be reset
    expect(audioService.getCurrentTrack()).toBeNull();
    expect(audioService.isLoaded()).toBe(false);
    expect(audioService.isPlaying()).toBe(false);
  });

  it('should prevent operations when disposed', async () => {
    await audioService.dispose();

    const track = createMockTrack('track1', 'file://track1.mp3');

    await expect(audioService.loadAudio(track)).rejects.toThrow(
      'Audio service has been disposed'
    );
    await expect(audioService.play()).rejects.toThrow(
      'Audio service has been disposed'
    );
  });

  it('should force stop all audio and reset state', async () => {
    const track = createMockTrack('track1', 'file://track1.mp3');

    // Load and play track
    await audioService.loadAudio(track);
    await audioService.play();
    expect(audioService.isPlaying()).toBe(true);

    // Force stop
    await audioService.forceStop();
    expect(audioService.isPlaying()).toBe(false);
    expect(audioService.getCurrentTrack()).toBeNull();
    expect(audioService.isLoaded()).toBe(false);
  });
});
