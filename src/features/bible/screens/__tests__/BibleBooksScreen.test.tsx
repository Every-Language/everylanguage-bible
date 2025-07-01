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

jest.mock('@/shared/store', () => ({
  useTheme: () => mockUseTheme,
}));

// Mock the bibleData utility
jest.mock('@/shared/utils', () => ({
  loadBibleBooks: () => [
    {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: 'assets/images/books/01_genesis.png',
    },
    {
      id: 'exo',
      name: 'Exodus',
      chapters: 40,
      testament: 'old',
      imagePath: 'assets/images/books/02_exodus.png',
    },
    {
      id: 'mat',
      name: 'Matthew',
      chapters: 28,
      testament: 'new',
      imagePath: 'assets/images/books/40_matthew.png',
    },
  ],
}));

describe('BibleBooksScreen', () => {
  const mockOnChapterSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const { getByText } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    expect(getByText('Loading Bible books...')).toBeTruthy();
  });

  it('renders Bible title and theme toggle after loading', async () => {
    const { getByText, getByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      expect(getByText('Bible')).toBeTruthy();
      expect(getByTestId('theme-toggle-button')).toBeTruthy();
    });
  });

  it('renders theme toggle with correct icon for light mode', async () => {
    mockUseTheme.isDark = false;
    const { getByText } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      expect(getByText('🌙')).toBeTruthy();
    });
  });

  it('renders theme toggle with correct icon for dark mode', async () => {
    mockUseTheme.isDark = true;
    const { getByText } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      expect(getByText('☀️')).toBeTruthy();
    });
  });

  it('calls toggleTheme when theme toggle is pressed', async () => {
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

  it('calls onChapterSelect when a chapter is selected', async () => {
    const { getByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // First click on book to expand
      const bookCard = getByTestId('book-card-gen');
      fireEvent.press(bookCard);
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
