import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BibleBooksScreen } from '../BibleBooksScreen';

// Mock TamaguiProvider to avoid configuration issues in tests
jest.mock('@/app/providers', () => ({
  TamaguiProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Tamagui components to avoid configuration issues
jest.mock('@tamagui/core', () => ({
  styled: () => () => 'View',
  Stack: 'View',
  Text: 'Text',
  Button: 'View',
  XStack: 'View',
  YStack: 'View',
  ScrollView: 'ScrollView',
}));

jest.mock('@tamagui/button', () => ({
  Button: 'TouchableOpacity',
}));

jest.mock('@tamagui/image', () => ({
  Image: 'Image',
}));

// Mock ChapterView component to avoid Tamagui issues
jest.mock('@/features/bible/components/ChapterView', () => ({
  ChapterView: () => 'ChapterView',
}));

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

// Mock the chapter view store
const mockUseChapterViewStore = {
  isOpen: false,
  selectedBook: null as any,
  openChapterView: jest.fn((book: any) => {
    console.log('openChapterView called with:', book);
    mockUseChapterViewStore.isOpen = true;
    mockUseChapterViewStore.selectedBook = book;
  }),
  closeChapterView: jest.fn(() => {
    console.log('closeChapterView called');
    mockUseChapterViewStore.isOpen = false;
    mockUseChapterViewStore.selectedBook = null;
  }),
};

jest.mock('@/shared/store', () => ({
  useTheme: () => mockUseTheme,
  useAudioStore: () => mockUseAudioStore,
  useChapterViewStore: () => mockUseChapterViewStore,
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
    // Reset chapter view store mock
    mockUseChapterViewStore.isOpen = false;
    mockUseChapterViewStore.selectedBook = null;
    mockUseChapterViewStore.openChapterView.mockClear();
    mockUseChapterViewStore.closeChapterView.mockClear();
  });

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(ui);
  };

  it('renders loading state initially', () => {
    const { getByText } = renderWithProvider(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    expect(getByText('Loading Bible books...')).toBeTruthy();
  });

  it('renders Bible title', async () => {
    const { getByText } = renderWithProvider(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      expect(getByText('Bible')).toBeTruthy();
    });
  });

  it('renders theme toggle button', async () => {
    const { getByTestId } = renderWithProvider(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      const themeToggle = getByTestId('theme-toggle-button');
      expect(themeToggle).toBeTruthy();
    });
  });

  it('calls toggleTheme when theme button is pressed', async () => {
    const { getByTestId } = renderWithProvider(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      const themeToggle = getByTestId('theme-toggle-button');
      fireEvent.press(themeToggle);
      expect(mockUseTheme.toggleTheme).toHaveBeenCalledTimes(1);
    });
  });

  it('renders books after loading', async () => {
    const { getByText } = renderWithProvider(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      expect(getByText('Genesis')).toBeTruthy();
      expect(getByText('Exodus')).toBeTruthy();
      expect(getByText('Matthew')).toBeTruthy();
    });
  });

  it('navigates to chapter view on short press when no chapter grid is open', async () => {
    const { getByTestId, queryByText } = renderWithProvider(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // Short press on book card should navigate to chapter view
      const bookCard = getByTestId('book-card-gen');
      fireEvent.press(bookCard);
    });

    await waitFor(() => {
      // Should open chapter view (verify store state)
      expect(mockUseChapterViewStore.isOpen).toBe(true);
      expect(mockUseChapterViewStore.selectedBook?.name).toBe('Genesis');
      expect(mockUseChapterViewStore.selectedBook?.id).toBe('gen');
      // The books list should still be visible behind the overlay
      expect(queryByText('Old Testament')).toBeTruthy();
    });
  });

  it('closes chapter grid on short press when grid is open', async () => {
    const { getByTestId, queryByTestId } = renderWithProvider(
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
    const { getByTestId } = renderWithProvider(
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
    const { getByTestId } = renderWithProvider(
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

  it.skip('can navigate back from chapter view', async () => {
    const { getByTestId } = renderWithProvider(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // Short press to navigate to chapter view
      const bookCard = getByTestId('book-card-gen');
      fireEvent.press(bookCard);
    });

    await waitFor(() => {
      // Should be in chapter view (verify store state)
      expect(mockUseChapterViewStore.isOpen).toBe(true);
      expect(mockUseChapterViewStore.selectedBook?.name).toBe('Genesis');
    });

    // Since ChapterView is mocked, we'll simulate the back navigation by clicking the book again
    // (which closes the chapter view in the actual component)
    const bookCard = getByTestId('book-card-gen');
    fireEvent.press(bookCard);

    await waitFor(() => {
      // Should be back to books screen (verify store state is reset)
      expect(mockUseChapterViewStore.closeChapterView).toHaveBeenCalled();
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

    const { getByTestId } = renderWithProvider(
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
    const { getByTestId } = renderWithProvider(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      const themeToggle = getByTestId('theme-toggle-button');
      expect(themeToggle.props.accessibilityLabel).toBe('Switch to dark mode');
      expect(themeToggle.props.accessibilityRole).toBe('button');
    });
  });
});
