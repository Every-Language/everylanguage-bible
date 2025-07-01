import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BibleBooksScreen } from '../BibleBooksScreen';

// Mock the utils
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
    {
      id: '40',
      name: 'Matthew',
      testament: 'new',
      chapters: 28,
      order: 40,
      imagePath: '40_matthew.png',
    },
  ],
}));

describe('BibleBooksScreen', () => {
  const mockOnChapterSelect = jest.fn();

  beforeEach(() => {
    mockOnChapterSelect.mockClear();
  });

  it('renders loading state initially', () => {
    const { getByText } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    expect(getByText('Loading Bible books...')).toBeTruthy();
  });

  it('renders Bible books after loading with testament sections', async () => {
    const { getByText } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      expect(getByText('Bible')).toBeTruthy();
      expect(getByText('Old Testament')).toBeTruthy();
      expect(getByText('New Testament')).toBeTruthy();
    });
  });

  it('renders book cards from both testaments', async () => {
    const { getByText } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      expect(getByText('Genesis')).toBeTruthy();
      expect(getByText('Exodus')).toBeTruthy();
      expect(getByText('Matthew')).toBeTruthy();
    });
  });

  it('expands chapter grid when book is tapped', async () => {
    const { getByTestId, queryByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // Initially, no chapter grid should be visible
      expect(queryByTestId('chapter-grid-01')).toBeNull();

      // Tap on Genesis
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    // Chapter grid should now be visible
    await waitFor(() => {
      expect(getByTestId('chapter-grid-01')).toBeTruthy();
    });
  });

  it('closes chapter grid when same book is tapped again', async () => {
    const { getByTestId, queryByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      const genesisCard = getByTestId('book-card-01');

      // First tap - opens grid
      fireEvent.press(genesisCard);
    });

    await waitFor(() => {
      expect(getByTestId('chapter-grid-01')).toBeTruthy();

      // Second tap - closes grid
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    await waitFor(() => {
      expect(queryByTestId('chapter-grid-01')).toBeNull();
    });
  });

  it('calls onChapterSelect when a chapter is tapped', async () => {
    const { getByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // First expand Genesis
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    await waitFor(() => {
      // Then tap chapter 5
      const chapterTile = getByTestId('chapter-tile-5');
      fireEvent.press(chapterTile);
    });

    expect(mockOnChapterSelect).toHaveBeenCalledWith(
      {
        id: '01',
        name: 'Genesis',
        testament: 'old',
        chapters: 50,
        order: 1,
        imagePath: '01_genesis.png',
      },
      5
    );
  });

  it('applies visual feedback to selected book', async () => {
    const { getByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    // The book should have selected styling applied
    // Note: In a real test, you might check for specific style properties
    // For now, we're just ensuring the component re-renders correctly
    await waitFor(() => {
      expect(getByTestId('chapter-grid-01')).toBeTruthy();
    });
  });

  it('switches between different book expansions', async () => {
    const { getByTestId, queryByTestId } = render(
      <BibleBooksScreen onChapterSelect={mockOnChapterSelect} />
    );

    await waitFor(() => {
      // First expand Genesis
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    await waitFor(() => {
      expect(getByTestId('chapter-grid-01')).toBeTruthy();

      // Then expand Exodus
      const exodusCard = getByTestId('book-card-02');
      fireEvent.press(exodusCard);
    });

    await waitFor(() => {
      // Genesis grid should be gone, Exodus grid should be visible
      expect(queryByTestId('chapter-grid-01')).toBeNull();
      expect(getByTestId('chapter-grid-02')).toBeTruthy();
    });
  });
});
