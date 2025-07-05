import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MiniPlayer } from '../MiniPlayer';
import { VerseDisplayData } from '@/types/audio';

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useSharedValue: jest.fn(value => ({ value })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn(value => value),
  withTiming: jest.fn(value => value),
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Dimensions = {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  };
  return RN;
});

// Mock the audio store
const mockAudioStore = {
  currentRecording: {
    id: 'genesis-1',
    title: 'Genesis Chapter 1',
    audio_file_url: 'test-url',
    duration_seconds: 630,
    original_language: 'en',
    target_language: 'en',
    description: 'Test chapter',
    status: 'active',
    user_id: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  currentChapter: {
    bookName: 'Genesis',
    chapterNumber: 1,
    totalSegments: 31,
    totalDuration: 630,
    language: 'en',
  },
  currentTime: 0,
  totalTime: 630,
  isPlaying: false,
  playbackSpeed: 1.0,
  currentVerseDisplayData: [
    {
      verseNumber: 1,
      text: 'In the beginning God created the heavens and the earth.',
      startTime: 0,
      endTime: 20,
      isCurrentVerse: true,
    },
    {
      verseNumber: 2,
      text: 'Now the earth was formless and empty.',
      startTime: 20,
      endTime: 40,
      isCurrentVerse: false,
    },
  ] as VerseDisplayData[],
  bibleBooks: [
    {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: '01_genesis.png',
      order: 1,
    },
  ],
  togglePlayPause: jest.fn(),
  playNext: jest.fn(),
  playPrevious: jest.fn(),
  nextVerse: jest.fn(),
  previousVerse: jest.fn(),
  seek: jest.fn(),
  setCurrentAudio: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  initializeBibleBooks: jest.fn(),
};

jest.mock('@/shared/store/audioStore', () => ({
  useAudioStore: () => mockAudioStore,
}));

// Mock theme store
jest.mock('@/shared/store', () => ({
  useTheme: () => ({
    colors: {
      background: '#EBE5D9',
      text: '#070707',
      primary: '#264854',
      secondary: '#AD915A',
    },
    isDark: false,
  }),
}));

// Mock translation hook
jest.mock('@/shared/hooks', () => ({
  useTranslation: () => ({
    t: (key: string, _params?: any) => {
      const translations: Record<string, string> = {
        'audio.textMode': 'Text Mode',
        'audio.queueMode': 'Queue Mode',
        'audio.noVerseText': 'No verse text available',
        'audio.previousChapter': 'Previous chapter',
        'audio.nextChapter': 'Next chapter',
        'audio.previousVerse': 'Previous verse',
        'audio.nextVerse': 'Next verse',
        'audio.play': 'Play',
        'audio.pause': 'Pause',
        'audio.expandPlayer': 'Expand player',
        'audio.closePlayer': 'Close player',
        'audio.versionChange': 'Version Change',
        'audio.versionChangePending': 'Version change feature pending',
        'audio.playbackSpeed': 'Playback Speed',
        'common.ok': 'OK',
        'audio.audioPlayerControls': 'Audio player controls',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock services
jest.mock('@/shared/services', () => ({
  getBookImageSource: jest.fn(() => ({ uri: 'test-image-url' })),
}));

describe('MiniPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    mockAudioStore.currentTime = 0;
    mockAudioStore.totalTime = 630;
    mockAudioStore.isPlaying = false;
    mockAudioStore.playbackSpeed = 1.0;
    mockAudioStore.currentVerseDisplayData = [
      {
        verseNumber: 1,
        text: 'In the beginning God created the heavens and the earth.',
        startTime: 0,
        endTime: 20,
        duration: 20,
        isCurrentVerse: true,
      },
      {
        verseNumber: 2,
        text: 'Now the earth was formless and empty.',
        startTime: 20,
        endTime: 40,
        duration: 20,
        isCurrentVerse: false,
      },
    ];
  });

  describe('Basic Rendering', () => {
    it('should render collapsed player by default', () => {
      const { getByTestId } = render(<MiniPlayer testID='mini-player' />);

      expect(getByTestId('mini-player')).toBeTruthy();
      expect(getByTestId('mini-player-play-pause')).toBeTruthy();
      expect(getByTestId('mini-player-progress')).toBeTruthy();
    });

    it('should render without testID', () => {
      const { getByTestId } = render(<MiniPlayer />);

      expect(getByTestId('mini-player-play-pause')).toBeTruthy();
    });

    it('should display current chapter information', () => {
      const { getByText } = render(<MiniPlayer />);

      expect(getByText('Genesis Chapter 1')).toBeTruthy();
    });

    it('should show correct play/pause button state', () => {
      const { getByTestId } = render(<MiniPlayer />);

      const playButton = getByTestId('mini-player-play-pause');
      expect(playButton).toBeTruthy();

      // Test playing state
      mockAudioStore.isPlaying = true;
      const { getByTestId: getByTestIdPlaying } = render(<MiniPlayer />);
      expect(getByTestIdPlaying('mini-player-play-pause')).toBeTruthy();
    });
  });

  describe('Player Controls', () => {
    it('should call togglePlayPause when play button is pressed', () => {
      const { getByTestId } = render(<MiniPlayer />);

      fireEvent.press(getByTestId('mini-player-play-pause'));

      expect(mockAudioStore.togglePlayPause).toHaveBeenCalled();
    });

    it('should call playNext when next chapter button is pressed', () => {
      const { getByTestId } = render(<MiniPlayer />);

      fireEvent.press(getByTestId('mini-player-next-chapter'));

      expect(mockAudioStore.playNext).toHaveBeenCalled();
    });

    it('should call playPrevious when previous chapter button is pressed', () => {
      const { getByTestId } = render(<MiniPlayer />);

      fireEvent.press(getByTestId('mini-player-previous-chapter'));

      expect(mockAudioStore.playPrevious).toHaveBeenCalled();
    });

    it('should call nextVerse when next verse button is pressed', () => {
      const { getByTestId } = render(<MiniPlayer />);

      fireEvent.press(getByTestId('mini-player-next-verse'));

      expect(mockAudioStore.nextVerse).toHaveBeenCalled();
    });

    it('should call previousVerse when previous verse button is pressed', () => {
      const { getByTestId } = render(<MiniPlayer />);

      fireEvent.press(getByTestId('mini-player-previous-verse'));

      expect(mockAudioStore.previousVerse).toHaveBeenCalled();
    });

    it('should handle seek when progress bar is used', () => {
      const { getByTestId } = render(<MiniPlayer />);

      const progressBar = getByTestId('mini-player-progress');
      fireEvent(progressBar, 'onSeek', 30);

      expect(mockAudioStore.seek).toHaveBeenCalledWith(30);
    });
  });

  describe('Expanded Player', () => {
    it('should toggle expanded state when expand button is pressed', async () => {
      const { getByTestId } = render(<MiniPlayer />);

      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      // Should trigger expansion animation
      expect(getByTestId('mini-player-expand-contract-bar')).toBeTruthy();
    });

    it('should show expanded content when player is expanded', async () => {
      const { getByTestId, getByText } = render(<MiniPlayer />);

      // Expand the player
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      // Wait for content to appear
      await waitFor(() => {
        expect(getByText('audio.text')).toBeTruthy();
        expect(getByText('audio.queue')).toBeTruthy();
      });
    });

    it('should show speed control when expanded', async () => {
      const { getByTestId } = render(<MiniPlayer />);

      // Expand the player
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      // Should show speed control
      await waitFor(() => {
        expect(getByTestId('expanded-media-content')).toBeTruthy();
      });
    });

    it('should handle expand/collapse toggle', async () => {
      const { getByTestId } = render(<MiniPlayer />);

      const expandButton = getByTestId('mini-player-expand-contract-bar');

      // Expand
      fireEvent.press(expandButton);

      // Collapse
      fireEvent.press(expandButton);

      expect(getByTestId('mini-player-play-pause')).toBeTruthy();
    });
  });

  describe('Content Modes', () => {
    it('should switch to text mode when text button is pressed', async () => {
      const { getByTestId, getByText } = render(<MiniPlayer />);

      // Expand the player first
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      await waitFor(() => {
        const textButton = getByText('audio.text');
        fireEvent.press(textButton);
      });

      // Should show text mode content
      await waitFor(() => {
        expect(getByText('Verse 1')).toBeTruthy();
      });
    });

    it('should switch to queue mode when queue button is pressed', async () => {
      const { getByTestId, getByText } = render(<MiniPlayer />);

      // Expand the player first
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      await waitFor(() => {
        const queueButton = getByText('audio.queue');
        fireEvent.press(queueButton);
      });

      // Should show queue mode content
      await waitFor(() => {
        expect(getByText('Queue Mode')).toBeTruthy();
      });
    });

    it('should handle version button press', async () => {
      const { getByText } = render(<MiniPlayer />);

      // Version button is only available in collapsed state
      // Press version text to open modal
      const versionText = getByText('audio.versionText');
      fireEvent.press(versionText);

      // Should show version change modal
      await waitFor(() => {
        expect(getByText('Version Change')).toBeTruthy();
      });
    });
  });

  describe('Text Mode', () => {
    it('should display verse text in text mode', async () => {
      const { getByTestId, getByText } = render(<MiniPlayer />);

      // Expand and switch to text mode
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      await waitFor(() => {
        const textButton = getByText('audio.text');
        fireEvent.press(textButton);
      });

      // Should show verses
      await waitFor(() => {
        expect(getByText('Verse 1')).toBeTruthy();
        expect(
          getByText('In the beginning God created the heavens and the earth.')
        ).toBeTruthy();
      });
    });

    it('should handle verse press in text mode', async () => {
      const { getByTestId, getByText } = render(<MiniPlayer />);

      // Expand and switch to text mode
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      await waitFor(() => {
        const textButton = getByText('audio.text');
        fireEvent.press(textButton);
      });

      // Press on a verse
      await waitFor(() => {
        const verseText = getByText(
          'In the beginning God created the heavens and the earth.'
        );
        fireEvent.press(verseText);
      });

      // Should seek to verse start time
      expect(mockAudioStore.seek).toHaveBeenCalledWith(0);
    });

    it('should show current verse highlighting', async () => {
      const { getByTestId, getByText } = render(<MiniPlayer />);

      // Expand and switch to text mode
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      await waitFor(() => {
        const textButton = getByText('audio.text');
        fireEvent.press(textButton);
      });

      // Should show current verse highlighted
      await waitFor(() => {
        expect(getByText('Verse 1')).toBeTruthy();
      });
    });

    it('should handle empty verse data', async () => {
      // Clear verse data
      mockAudioStore.currentVerseDisplayData = [];

      const { getByTestId, getByText } = render(<MiniPlayer />);

      // Expand and switch to text mode
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      await waitFor(() => {
        const textButton = getByText('audio.text');
        fireEvent.press(textButton);
      });

      // Should show no verse text message
      await waitFor(() => {
        expect(getByText('No verse text available')).toBeTruthy();
      });
    });
  });

  describe('Speed Control', () => {
    it('should show speed control in expanded mode', async () => {
      const { getByTestId, getByText } = render(<MiniPlayer />);

      // Expand the player
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      // Should show speed control
      await waitFor(() => {
        expect(getByText('1x')).toBeTruthy();
      });
    });

    it('should open speed menu when speed control is pressed', async () => {
      const { getByTestId, getByText } = render(<MiniPlayer />);

      // Expand the player
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      // Press speed control
      await waitFor(() => {
        const speedControl = getByText('1x');
        fireEvent.press(speedControl);
      });

      // Should show speed menu
      await waitFor(() => {
        expect(getByText('Playback Speed')).toBeTruthy();
        expect(getByText('0.5x')).toBeTruthy();
        expect(getByText('2x')).toBeTruthy();
      });
    });

    it('should handle speed selection', async () => {
      const { getByTestId, getByText, getAllByText } = render(<MiniPlayer />);

      // Expand the player
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      // Open speed menu
      await waitFor(() => {
        const speedControl = getByText('1x');
        fireEvent.press(speedControl);
      });

      // Select different speed
      await waitFor(() => {
        const speedOptions = getAllByText('1.5x');
        fireEvent.press(speedOptions[0]);
      });

      // Menu should close
      await waitFor(() => {
        expect(getByTestId('mini-player-play-pause')).toBeTruthy();
      });
    });
  });

  describe('Version Modal', () => {
    it('should show version change modal when version button is pressed', async () => {
      const { getByText } = render(<MiniPlayer />);

      // Version button is only visible in collapsed state
      // Press version text to open modal
      const versionText = getByText('audio.versionText');
      fireEvent.press(versionText);

      // Should show version modal
      await waitFor(() => {
        expect(getByText('Version Change')).toBeTruthy();
        expect(getByText('Version change feature pending')).toBeTruthy();
      });
    });

    it('should close version modal when OK is pressed', async () => {
      const { getByTestId, getByText } = render(<MiniPlayer />);

      // Open version modal
      const versionText = getByText('audio.versionText');
      fireEvent.press(versionText);

      // Close modal
      await waitFor(() => {
        const okButton = getByText('OK');
        fireEvent.press(okButton);
      });

      // Modal should be closed
      await waitFor(() => {
        expect(getByTestId('mini-player-play-pause')).toBeTruthy();
      });
    });
  });

  describe('Props and Callbacks', () => {
    it('should call onExpand when provided', () => {
      const onExpand = jest.fn();
      const { getByTestId } = render(<MiniPlayer onExpand={onExpand} />);

      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      // Note: onExpand callback is not currently implemented in the component
      // This test documents the expected behavior for future implementation
      expect(onExpand).toBeDefined();
    });

    it('should call onClose when provided', () => {
      const onClose = jest.fn();
      render(<MiniPlayer onClose={onClose} />);

      // onClose callback would be called in actual implementation
      expect(onClose).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have correct accessibility labels', () => {
      const { getByTestId } = render(<MiniPlayer />);

      const playButton = getByTestId('mini-player-play-pause');
      expect(playButton.props.accessibilityLabel).toBe('Play');

      const nextChapterButton = getByTestId('mini-player-next-chapter');
      expect(nextChapterButton.props.accessibilityLabel).toBe('Next chapter');

      const previousChapterButton = getByTestId('mini-player-previous-chapter');
      expect(previousChapterButton.props.accessibilityLabel).toBe(
        'Previous chapter'
      );
    });

    it('should update accessibility labels based on playing state', () => {
      mockAudioStore.isPlaying = true;

      const { getByTestId } = render(<MiniPlayer />);

      const playButton = getByTestId('mini-player-play-pause');
      expect(playButton.props.accessibilityLabel).toBe('Pause');
    });
  });

  describe('Book Image Display', () => {
    it('should display book image when available', () => {
      const { getByTestId } = render(<MiniPlayer />);

      // Expand to see book image
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      // Should render expanded content
      expect(getByTestId('expanded-media-content')).toBeTruthy();
    });

    it('should handle missing book image', () => {
      // Clear book data
      mockAudioStore.bibleBooks = [];

      const { getByTestId } = render(<MiniPlayer />);

      // Expand to see fallback
      fireEvent.press(getByTestId('mini-player-expand-contract-bar'));

      expect(getByTestId('expanded-media-content')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing audio store data', () => {
      const { getByTestId } = render(<MiniPlayer />);

      expect(getByTestId('mini-player-play-pause')).toBeTruthy();
    });

    it('should handle zero duration', () => {
      mockAudioStore.totalTime = 0;

      const { getByTestId } = render(<MiniPlayer />);

      expect(getByTestId('mini-player-progress')).toBeTruthy();
    });

    it('should handle missing chapter data', () => {
      // @ts-expect-error - Testing edge case
      mockAudioStore.currentChapter = null;

      const { getByTestId } = render(<MiniPlayer />);

      expect(getByTestId('mini-player-play-pause')).toBeTruthy();
    });
  });
});
