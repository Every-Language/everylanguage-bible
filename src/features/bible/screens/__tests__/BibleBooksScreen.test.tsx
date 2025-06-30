import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BibleBooksScreen } from '../BibleBooksScreen';

describe('BibleBooksScreen', () => {
  const mockOnBookSelect = jest.fn();

  beforeEach(() => {
    mockOnBookSelect.mockClear();
  });

  it('renders loading state initially', () => {
    const { getByText } = render(
      <BibleBooksScreen onBookSelect={mockOnBookSelect} />
    );

    expect(getByText('Loading Bible books...')).toBeTruthy();
  });

  it('renders Bible books after loading with testament sections', async () => {
    const { getByText, getByTestId } = render(
      <BibleBooksScreen onBookSelect={mockOnBookSelect} />
    );

    await waitFor(() => {
      expect(getByText('Bible')).toBeTruthy();
      expect(getByText('Choose a book to start listening')).toBeTruthy();
      expect(getByText('Old Testament')).toBeTruthy();
      expect(getByText('New Testament')).toBeTruthy();
      expect(getByTestId('old-testament-books-list')).toBeTruthy();
      expect(getByTestId('new-testament-books-list')).toBeTruthy();
    });
  });

  it('renders book cards from both testaments', async () => {
    const { getByText } = render(
      <BibleBooksScreen onBookSelect={mockOnBookSelect} />
    );

    await waitFor(() => {
      // Old Testament books
      expect(getByText('Genesis')).toBeTruthy();
      expect(getByText('Exodus')).toBeTruthy();
      expect(getByText('Ruth')).toBeTruthy();

      // New Testament books
      expect(getByText('Matthew')).toBeTruthy();
      expect(getByText('Mark')).toBeTruthy();
      expect(getByText('Revelation')).toBeTruthy();
    });
  });

  it('calls onBookSelect when a book is tapped', async () => {
    const { getByTestId } = render(
      <BibleBooksScreen onBookSelect={mockOnBookSelect} />
    );

    await waitFor(() => {
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    expect(mockOnBookSelect).toHaveBeenCalledWith({
      id: '01',
      name: 'Genesis',
      testament: 'old',
      chapters: 50,
      order: 1,
      imagePath: '01_genesis.png',
    });
  });

  it('has proper accessibility structure for both testaments', async () => {
    const { getByTestId } = render(
      <BibleBooksScreen onBookSelect={mockOnBookSelect} />
    );

    await waitFor(() => {
      const oldTestamentList = getByTestId('old-testament-books-list');
      const newTestamentList = getByTestId('new-testament-books-list');
      expect(oldTestamentList).toBeTruthy();
      expect(newTestamentList).toBeTruthy();
    });
  });
});
