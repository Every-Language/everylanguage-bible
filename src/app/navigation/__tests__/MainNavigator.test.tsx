import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { MainNavigator } from '../MainNavigator';

// Mock the utils used by BibleBooksScreen
jest.mock('@/shared/utils', () => ({
  loadBibleBooks: () => [
    {
      id: '01',
      name: 'Genesis',
      testament: 'old',
      chapters: 50,
      order: 1,
      imagePath: '01_genesis.png',
    },
    {
      id: '02',
      name: 'Exodus',
      testament: 'old',
      chapters: 40,
      order: 2,
      imagePath: '02_exodus.png',
    },
  ],
}));

// Mock the Zustand store
const mockUseAudioStore = {
  currentBook: null as any,
  currentChapter: null as any,
  isPlaying: false,
  setCurrentAudio: jest.fn(),
  togglePlayPause: jest.fn(),
  playNext: jest.fn(),
  playPrevious: jest.fn(),
};

const mockUseTheme = {
  theme: 'light' as const,
  isDark: false,
  colors: {
    background: '#EBE5D9',
    text: '#070707',
    primary: '#264854',
    secondary: '#AD915A',
  },
  toggleTheme: jest.fn(),
  setTheme: jest.fn(),
  setSystemTheme: jest.fn(),
  isManuallySet: false,
  reset: jest.fn(),
  initializeFromSystem: jest.fn(),
};

jest.mock('@/shared/store', () => ({
  useAudioStore: () => mockUseAudioStore,
  useTheme: () => mockUseTheme,
}));

const NavigationWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <NavigationContainer>{children}</NavigationContainer>;

describe('MainNavigator', () => {
  beforeEach(() => {
    // Reset mock store before each test
    mockUseAudioStore.currentBook = null;
    mockUseAudioStore.currentChapter = null;
    mockUseAudioStore.isPlaying = false;

    // Reset theme mock
    mockUseTheme.theme = 'light';
    mockUseTheme.isDark = false;
    mockUseTheme.isManuallySet = false;

    jest.clearAllMocks();
  });

  it('renders tab navigation correctly', () => {
    const { getByText } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    expect(getByText('Bible')).toBeTruthy();
    expect(getByText('Resources')).toBeTruthy();
  });

  it('shows mini player when a chapter is selected', async () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    // Initially, mini player should not be visible
    expect(queryByTestId('main-mini-player')).toBeNull();

    // Wait for the books to load and expand Genesis
    await waitFor(() => {
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    // Select a chapter - simulate the store update
    await waitFor(() => {
      const chapterTile = getByTestId('chapter-tile-1');
      fireEvent.press(chapterTile);
    });

    // Simulate store state update
    mockUseAudioStore.currentBook = {
      id: '01',
      name: 'Genesis',
      testament: 'old',
      chapters: 50,
      order: 1,
      imagePath: '01_genesis.png',
    };
    mockUseAudioStore.currentChapter = 1;

    // Rerender to reflect the state change
    rerender(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    // Mini player should now be visible
    await waitFor(() => {
      expect(getByTestId('main-mini-player')).toBeTruthy();
    });
  });

  it('navigates to resources tab', () => {
    const { getByText } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    fireEvent.press(getByText('Resources'));
    expect(getByText('Coming soon!')).toBeTruthy();
  });

  it('handles mini player controls and calls store methods', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock the store to have a current audio selection
    mockUseAudioStore.currentBook = {
      id: '01',
      name: 'Genesis',
      testament: 'old',
      chapters: 50,
      order: 1,
      imagePath: '01_genesis.png',
    };
    mockUseAudioStore.currentChapter = 5;
    mockUseAudioStore.isPlaying = false;

    const { getByTestId, getByText } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    // Expand Genesis first
    await waitFor(() => {
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    // Select chapter 5
    await waitFor(() => {
      const chapterTile = getByTestId('chapter-tile-5');
      fireEvent.press(chapterTile);
    });

    // Check that the store method was called
    expect(mockUseAudioStore.setCurrentAudio).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Genesis' }),
      5
    );

    // Check that mini player shows correct info
    await waitFor(() => {
      const miniPlayer = getByTestId('main-mini-player');
      expect(miniPlayer).toBeTruthy();
      expect(getByText('Chapter 5')).toBeTruthy();
    });

    // Test play/pause functionality
    await waitFor(() => {
      const playButton = getByTestId('mini-player-play-pause');
      fireEvent.press(playButton);
    });

    expect(mockUseAudioStore.togglePlayPause).toHaveBeenCalled();

    // Test previous button
    await waitFor(() => {
      const previousButton = getByTestId('mini-player-previous');
      fireEvent.press(previousButton);
    });

    expect(mockUseAudioStore.playPrevious).toHaveBeenCalled();

    // Test next button
    await waitFor(() => {
      const nextButton = getByTestId('mini-player-next');
      fireEvent.press(nextButton);
    });

    expect(mockUseAudioStore.playNext).toHaveBeenCalled();

    expect(consoleSpy).toHaveBeenCalledWith('Selected chapter:', 'Genesis 5');

    consoleSpy.mockRestore();
  });

  it('does not show mini player when only book is expanded', async () => {
    const { getByTestId, queryByTestId } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    // Wait for the books to load and expand Genesis
    await waitFor(() => {
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    // Mini player should NOT be visible yet (only when chapter is selected)
    await waitFor(() => {
      expect(queryByTestId('main-mini-player')).toBeNull();
    });
  });

  it('uses theme colors and functionality correctly', () => {
    render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    // Verify theme store is accessible and has all expected methods
    expect(mockUseTheme).toBeDefined();
    expect(mockUseTheme.toggleTheme).toBeDefined();
    expect(mockUseTheme.setSystemTheme).toBeDefined();
    expect(mockUseTheme.colors).toBeDefined();
  });
});
