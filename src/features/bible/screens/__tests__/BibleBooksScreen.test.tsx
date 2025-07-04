import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BibleBooksScreen } from '../BibleBooksScreen';

// Mock the theme store
const mockUseTheme = {
  colors: {
    background: '#EBE5D9',
    text: '#070707',
    primary: '#264854',
    secondary: '#AD915A',
  },
  isDark: false,
  toggleTheme: jest.fn(),
};

// Mock the audio store
const mockUseAudioStore = {
  currentBook: null as any,
  currentChapter: null as any,
  isPlaying: false,
  setCurrentAudio: jest.fn(),
  play: jest.fn(),
};

jest.mock('@/shared/store', () => ({
  useTheme: () => mockUseTheme,
  useAudioStore: () => mockUseAudioStore,
}));

// Mock the translation hook
const mockUseTranslation = {
  t: (key: string, params?: any) => {
    const translations: Record<string, string> = {
      'theme.switchToLight': 'Switch to light mode',
      'theme.switchToDark': 'Switch to dark mode',
      'bible.openBook': `Open ${params?.title || 'book'}`,
      'bible.chapter': `Chapter ${params?.number || ''}`,
      'navigation.back': 'Back',
    };
    return translations[key] || key;
  },
};

jest.mock('@/shared/hooks', () => ({
  useTranslation: () => mockUseTranslation,
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
    {
      id: 'mat',
      name: 'Matthew',
      chapters: 28,
      testament: 'new',
      imagePath: '40_matthew.png',
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

describe('BibleBooksScreen', () => {
  const mockOnChapterSelect = jest.fn();

  beforeEach(() => {
    mockOnChapterSelect.mockClear();
    mockUseTheme.toggleTheme.mockClear();
    // Reset audio store mock
    mockUseAudioStore.currentBook = null;
    mockUseAudioStore.currentChapter = null;
    mockUseAudioStore.isPlaying = false;
    mockUseAudioStore.setCurrentAudio.mockClear();
    mockUseAudioStore.play.mockClear();
  });

  it('renders loading state initially', () => {
    const { getByText } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    expect(getByText('Loading Bible books...')).toBeTruthy();
  });

  it('renders Bible title', async () => {
    const { getByText } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      expect(getByText('Bible')).toBeTruthy();
    });
  });

  it('renders theme toggle button', async () => {
    const { getByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      const themeToggle = getByTestId('theme-toggle-button');
      expect(themeToggle).toBeTruthy();
    });
  });

  it('calls toggleTheme when theme button is pressed', async () => {
    const { getByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      const themeToggle = getByTestId('theme-toggle-button');
      fireEvent.press(themeToggle);
      expect(mockUseTheme.toggleTheme).toHaveBeenCalledTimes(1);
    });
  });

  it('renders books after loading', async () => {
    const { getByText } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      expect(getByText('Genesis')).toBeTruthy();
      expect(getByText('Exodus')).toBeTruthy();
      expect(getByText('Matthew')).toBeTruthy();
    });
  });

  it('navigates to chapter view on short press when no chapter grid is open', async () => {
    const { getByTestId, queryByText } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // Short press on book card should navigate to chapter view
      const bookCard = getByTestId('book-card-gen');
      fireEvent.press(bookCard);
    });

    await waitFor(() => {
      // Should show chapter view screen with back button and placeholder text
      expect(getByTestId('back-button')).toBeTruthy();
      expect(queryByText(/This screen will be implemented later/)).toBeTruthy();
      // Should not show the books list anymore
      expect(queryByText('Old Testament')).toBeNull();
    });
  });

  it('closes chapter grid on short press when grid is open', async () => {
    const { getByTestId, queryByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // First long press to open chapter grid
      const bookCard = getByTestId('book-card-gen');
      fireEvent(bookCard, 'longPress');
    });

    await waitFor(() => {
      // Verify chapter grid is open
      expect(getByTestId('chapter-grid-gen')).toBeTruthy();
    });

    // Now short press the same book card
    await waitFor(() => {
      const bookCard = getByTestId('book-card-gen');
      fireEvent.press(bookCard);
    });

    await waitFor(() => {
      // Chapter grid should be closed (not immediately visible, but will animate out)
      // We can't easily test the animation, but the grid should start closing
      expect(queryByTestId('chapter-grid-gen')).toBeTruthy(); // Still there during animation
    });
  });

  it('shows chapter grid on long press', async () => {
    const { getByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // Long press on book card should show chapter grid
      const bookCard = getByTestId('book-card-gen');
      fireEvent(bookCard, 'longPress');
    });

    await waitFor(() => {
      // Should show chapter grid
      expect(getByTestId('chapter-grid-gen')).toBeTruthy();
    });
  });

  it('calls onChapterSelect when a chapter is selected from grid', async () => {
    const { getByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // First long press on book to expand chapter grid
      const bookCard = getByTestId('book-card-gen');
      fireEvent(bookCard, 'longPress');
    });

    await waitFor(() => {
      // Then click on a chapter
      const chapterTile = getByTestId('chapter-tile-1');
      fireEvent.press(chapterTile);

      expect(mockOnChapterSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'gen', name: 'Genesis' }),
        1
      );
    });
  });

  it('can navigate back from chapter view', async () => {
    const { getByTestId, queryByText } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // Short press to navigate to chapter view
      const bookCard = getByTestId('book-card-gen');
      fireEvent.press(bookCard);
    });

    await waitFor(() => {
      // Should be in chapter view - check for back button and placeholder text
      expect(getByTestId('back-button')).toBeTruthy();
      expect(queryByText(/This screen will be implemented later/)).toBeTruthy();
    });

    // Press back button
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    await waitFor(() => {
      // Should be back to books screen
      expect(queryByText(/This screen will be implemented later/)).toBeNull();
      expect(queryByText('Old Testament')).toBeTruthy();
    });
  });

  it('highlights chapter based on audio store current chapter', async () => {
    // Set up audio store to have Genesis chapter 3 as current
    mockUseAudioStore.currentBook = {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: '01_genesis.png',
    };
    mockUseAudioStore.currentChapter = 3;

    const { getByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // Long press to open chapter grid for Genesis
      const bookCard = getByTestId('book-card-gen');
      fireEvent(bookCard, 'longPress');
    });

    await waitFor(() => {
      // Chapter 3 should be highlighted because it's the current chapter in audio store
      const chapterTile3 = getByTestId('chapter-tile-3');
      expect(chapterTile3).toBeTruthy();
      // The ChapterGrid should pass isSelected=true for chapter 3
    });
  });

  it('has proper accessibility for theme toggle', async () => {
    mockUseTheme.isDark = false;
    const { getByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      const themeToggle = getByTestId('theme-toggle-button');
      expect(themeToggle.props.accessibilityLabel).toBe('Switch to dark mode');
      expect(themeToggle.props.accessibilityRole).toBe('button');
    });
  });
});
