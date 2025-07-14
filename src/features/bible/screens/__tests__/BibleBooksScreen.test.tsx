import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BibleBooksScreen } from '../BibleBooksScreen';

// Mock the theme hook
jest.mock('@/shared/hooks', () => ({
  useTheme: () => ({
    colors: {
      background: '#ffffff',
      textPrimary: '#000000',
      primary: '#264854',
      secondary: '#AD915A',
    },
    isDark: false,
  }),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the store
jest.mock('@/shared/store', () => ({
  useChapterCardStore: () => ({
    selectedBook: null,
    selectedChapter: null,
    isVisible: false,
    openChapterCard: jest.fn(),
    closeChapterCard: jest.fn(),
    setSelectedBook: jest.fn(),
    setSelectedChapter: jest.fn(),
  }),
}));

// Mock the bible data
jest.mock('@/shared/utils/bibleData', () => ({
  getBibleBooks: () => [
    {
      id: '1',
      name: 'Genesis',
      testament: 'old',
      imagePath: '01_genesis.png',
    },
    {
      id: '2',
      name: 'Exodus',
      testament: 'old',
      imagePath: '02_exodus.png',
    },
  ],
}));

// Mock the BookCard component
jest.mock('@/shared/components/ui/BookCard', () => ({
  BookCard: ({ bookName, onPress, testID }: any) => (
    <div onClick={onPress} data-testid={testID}>
      {bookName}
    </div>
  ),
}));

// Mock the BookImage component
jest.mock('@/shared/components/ui/BookImage', () => ({
  BookImage: ({ imagePath, testID }: any) => (
    <div data-testid={testID}>{imagePath}</div>
  ),
}));

describe('BibleBooksScreen', () => {
  const defaultProps = {
    onChapterSelect: jest.fn(),
    onVerseSelect: jest.fn(),
  };

  it('renders without crashing', () => {
    expect(() => render(<BibleBooksScreen {...defaultProps} />)).not.toThrow();
  });

  it('displays book cards', () => {
    const { getByText } = render(<BibleBooksScreen {...defaultProps} />);

    expect(getByText('Genesis')).toBeTruthy();
    expect(getByText('Exodus')).toBeTruthy();
  });

  it('handles book selection', () => {
    const mockOnChapterSelect = jest.fn();
    const { getByText } = render(
      <BibleBooksScreen
        {...defaultProps}
        onChapterSelect={mockOnChapterSelect}
      />
    );

    fireEvent.press(getByText('Genesis'));

    // The mock function should be called
    expect(mockOnChapterSelect).toHaveBeenCalled();
  });
});
