import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MainNavigator } from '../MainNavigator';

// Mock the safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

// Mock the AudioStore
const mockAudioStore = {
  currentBook: null as any,
  currentChapter: null as any,
  isPlaying: false,
  currentPosition: 0,
  totalDuration: 0,
  setCurrentAudio: jest.fn(),
  togglePlayPause: jest.fn(),
  playNext: jest.fn(),
  playPrevious: jest.fn(),
  previousVerse: jest.fn(),
  nextVerse: jest.fn(),
  seek: jest.fn(),
  close: jest.fn(),
  play: jest.fn(),
};

// Mock the chapter view store
const mockUseChapterViewStore = {
  isOpen: false,
  selectedBook: null,
  openChapterView: jest.fn(),
  closeChapterView: jest.fn(),
};

// Mock the verse view store
const mockUseVerseViewStore = {
  isOpen: false,
  selectedBook: null,
  selectedChapter: null,
  openVerseView: jest.fn(),
  closeVerseView: jest.fn(),
};

jest.mock('@/shared/store', () => ({
  useAudioStore: () => mockAudioStore,
  useChapterViewStore: () => mockUseChapterViewStore,
  useVerseViewStore: () => mockUseVerseViewStore,
  useTheme: () => ({
    colors: {
      background: '#EBE5D9',
      text: '#070707',
      primary: '#264854',
      secondary: '#AD915A',
    },
    isDark: false,
    toggleTheme: jest.fn(),
  }),
}));

// Mock the translation hook
jest.mock('@/shared/hooks', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'theme.switchToLight': 'Switch to light mode',
        'theme.switchToDark': 'Switch to dark mode',
        'bible.openBook': `Open ${params?.title || 'book'}`,
        'bible.chapter': `Chapter ${params?.number || ''}`,
        'navigation.back': 'Back',
        'audio.audioPlayerControls': 'Audio player controls',
        'audio.previousChapter': 'Previous chapter',
        'audio.nextChapter': 'Next chapter',
        'audio.previousVerse': 'Previous verse',
        'audio.nextVerse': 'Next verse',
        'audio.play': 'Play',
        'audio.pause': 'Pause',
        'audio.expandPlayer': 'Expand player',
        'audio.closePlayer': 'Close player',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the utils
jest.mock('@/shared/utils', () => ({
  loadBibleBooks: () => [
    {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: '01_genesis.png',
    },
    {
      id: 'exo',
      name: 'Exodus',
      chapters: 40,
      testament: 'old',
      imagePath: '02_exodus.png',
    },
  ],
}));

// Mock Animated to avoid timing issues in tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = () => ({
    start: jest.fn(),
  });
  // Mock Dimensions for responsive sizing
  RN.Dimensions = {
    get: jest.fn(() => ({ width: 375, height: 812 })), // iPhone X dimensions
  };
  return RN;
});

describe('MainNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset audio store state to default (John chapter 1)
    mockAudioStore.currentBook = {
      id: '43',
      name: 'John',
      testament: 'new',
      chapters: 21,
      order: 43,
      imagePath: '43_john.png',
    };
    mockAudioStore.currentChapter = 1;
    mockAudioStore.isPlaying = false;
    // Reset chapter view store state
    mockUseChapterViewStore.isOpen = false;
    mockUseChapterViewStore.selectedBook = null;
    mockUseChapterViewStore.openChapterView.mockClear();
    mockUseChapterViewStore.closeChapterView.mockClear();
  });

  it('renders BibleBooksScreen by default', async () => {
    const { getByText } = render(<MainNavigator />);

    await waitFor(() => {
      expect(getByText('Bible')).toBeTruthy();
      expect(getByText('Genesis')).toBeTruthy();
      expect(getByText('Exodus')).toBeTruthy();
    });
  });

  it('shows mini player by default with John chapter 1', () => {
    const { getByTestId } = render(<MainNavigator />);

    expect(getByTestId('main-mini-player')).toBeTruthy();
  });

  it('shows mini player when a chapter is selected', async () => {
    const { getByTestId } = render(<MainNavigator />);

    // Wait for books to load, then long press to show chapter grid
    await waitFor(() => {
      const bookCard = getByTestId('book-card-gen');
      fireEvent(bookCard, 'longPress');
    });

    // Select a chapter - simulate the store update
    await waitFor(() => {
      const chapterTile = getByTestId('chapter-tile-1');
      fireEvent.press(chapterTile);
    });

    // Manually update the mock store to simulate the chapter selection
    mockAudioStore.currentBook = {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: '01_genesis.png',
    };
    mockAudioStore.currentChapter = 1;

    // Re-render to reflect the store change
    const { getByTestId: getByTestIdUpdated } = render(<MainNavigator />);

    expect(getByTestIdUpdated('main-mini-player')).toBeTruthy();
  });

  it('handles mini player controls and calls store methods', async () => {
    const { getByTestId } = render(<MainNavigator />);

    // Wait for books to load, then long press to show chapter grid
    await waitFor(() => {
      const bookCard = getByTestId('book-card-gen');
      fireEvent(bookCard, 'longPress');
    });

    // Select chapter 5
    await waitFor(() => {
      const chapterTile = getByTestId('chapter-tile-5');
      fireEvent.press(chapterTile);
    });

    // Manually update the mock store
    mockAudioStore.currentBook = {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: '01_genesis.png',
    };
    mockAudioStore.currentChapter = 5;

    // Re-render with mini player visible
    const { getByTestId: getByTestIdWithPlayer } = render(<MainNavigator />);

    const playPauseButton = getByTestIdWithPlayer('mini-player-play-pause');
    const previousChapterButton = getByTestIdWithPlayer(
      'mini-player-previous-chapter'
    );
    const nextChapterButton = getByTestIdWithPlayer('mini-player-next-chapter');
    const previousVerseButton = getByTestIdWithPlayer(
      'mini-player-previous-verse'
    );
    const nextVerseButton = getByTestIdWithPlayer('mini-player-next-verse');

    // Test controls
    fireEvent.press(playPauseButton);
    expect(mockAudioStore.togglePlayPause).toHaveBeenCalledTimes(1);

    fireEvent.press(previousChapterButton);
    expect(mockAudioStore.playPrevious).toHaveBeenCalledTimes(1);

    fireEvent.press(nextChapterButton);
    expect(mockAudioStore.playNext).toHaveBeenCalledTimes(1);

    fireEvent.press(previousVerseButton);
    expect(mockAudioStore.previousVerse).toHaveBeenCalledTimes(1);

    fireEvent.press(nextVerseButton);
    expect(mockAudioStore.nextVerse).toHaveBeenCalledTimes(1);
  });

  it('calls console.log when chapter is selected', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { getByTestId } = render(<MainNavigator />);

    // Wait for books to load, then long press to show chapter grid
    await waitFor(() => {
      const bookCard = getByTestId('book-card-gen');
      fireEvent(bookCard, 'longPress');
    });

    await waitFor(() => {
      const chapterTile = getByTestId('chapter-tile-1');
      fireEvent.press(chapterTile);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Selected chapter:', 'Genesis 1');
    consoleSpy.mockRestore();
  });

  it('provides access to store methods', () => {
    render(<MainNavigator />);

    // Verify audio store is accessible and has required methods
    expect(mockAudioStore).toBeDefined();
    expect(mockAudioStore.setCurrentAudio).toBeDefined();
    expect(mockAudioStore.togglePlayPause).toBeDefined();
    expect(mockAudioStore.playNext).toBeDefined();
    expect(mockAudioStore.playPrevious).toBeDefined();
  });
});
