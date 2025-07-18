import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BibleView } from '../BibleView';

// Mock functions
const mockOnChapterSelect = jest.fn();
const mockOnVerseSelect = jest.fn();

// Helper function to render with providers
const renderWithProvider = (component: React.ReactElement) => {
  return render(component);
};

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

describe('BibleView', () => {
  const defaultProps = {
    _onChapterSelect: jest.fn(),
    _onVerseSelect: jest.fn(),
  };

  it('renders without crashing', () => {
    expect(() => render(<BibleView {...defaultProps} />)).not.toThrow();
  });

  it('displays book cards', () => {
    const { getByText } = render(<BibleView {...defaultProps} />);

    expect(getByText('Genesis')).toBeTruthy();
    expect(getByText('Exodus')).toBeTruthy();
  });

  it('handles book selection', () => {
    const mockOnChapterSelect = jest.fn();
    const { getByText } = render(
      <BibleView {...defaultProps} _onChapterSelect={mockOnChapterSelect} />
    );

    fireEvent.press(getByText('Genesis'));

    // The mock function should be called
    expect(mockOnChapterSelect).toHaveBeenCalled();
  });

  it('renders Bible title as a button', async () => {
    const { getByTestId } = renderWithProvider(
      <BibleView
        _onChapterSelect={mockOnChapterSelect}
        _onVerseSelect={mockOnVerseSelect}
      />
    );

    await waitFor(() => {
      const bibleTitleButton = getByTestId('bible-title-button');
      expect(bibleTitleButton).toBeTruthy();

      // Test that the button can be pressed
      fireEvent.press(bibleTitleButton);
      // The button should not crash when pressed
      expect(bibleTitleButton).toBeTruthy();
    });
  });

  it('handles options menu props correctly', () => {
    const mockOnOptionsClose = jest.fn();
    const mockOnOpenSubMenu = jest.fn();
    const mockOnCloseSubMenu = jest.fn();

    const { getByTestId } = renderWithProvider(
      <BibleView
        _onChapterSelect={mockOnChapterSelect}
        _onVerseSelect={mockOnVerseSelect}
        showOptionsPanel={true}
        onOptionsClose={mockOnOptionsClose}
        onOpenSubMenu={mockOnOpenSubMenu}
        onCloseSubMenu={mockOnCloseSubMenu}
        activeSubMenu={null}
      />
    );

    // The options menu should be rendered when showOptionsPanel is true
    expect(getByTestId('options-menu')).toBeTruthy();
  });
});
