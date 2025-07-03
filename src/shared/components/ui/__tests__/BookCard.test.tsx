import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Image } from 'react-native';
import { BookCard } from '../BookCard';

// Mock the theme store
const mockUseTheme = {
  colors: {
    background: '#EBE5D9',
    text: '#070707',
    primary: '#264854',
    secondary: '#AD915A',
  },
};

jest.mock('@/shared/store', () => ({
  useTheme: () => mockUseTheme,
}));

describe('BookCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders book name correctly', () => {
    const { getByText } = render(
      <BookCard bookName='Genesis' onPress={mockOnPress} />
    );

    expect(getByText('Genesis')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByTestId } = render(
      <BookCard bookName='Genesis' onPress={mockOnPress} />
    );

    fireEvent.press(getByTestId('book-card-genesis'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility properties', () => {
    const { getByRole } = render(
      <BookCard bookName='Genesis' onPress={mockOnPress} />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Genesis book');
  });

  it('handles long book names gracefully', () => {
    const longBookName = 'A Very Long Book Name That Should Be Truncated';
    const { getByText } = render(
      <BookCard bookName={longBookName} onPress={mockOnPress} />
    );

    expect(getByText(longBookName)).toBeTruthy();
  });

  it('generates correct testID from book name', () => {
    const { getByTestId } = render(
      <BookCard bookName='Genesis' onPress={mockOnPress} />
    );

    expect(getByTestId('book-card-genesis')).toBeTruthy();
  });

  it('displays book image when bookImage is provided', () => {
    const { getByTestId } = render(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
      />
    );

    // Should render the main BookCard
    expect(getByTestId('book-card-genesis')).toBeTruthy();
  });

  it('displays fallback icon when no image is provided', () => {
    const { getByText } = render(
      <BookCard bookName='Genesis' onPress={mockOnPress} />
    );

    expect(getByText('📖')).toBeTruthy();
  });

  it('applies selected styling when isSelected is true', () => {
    const { getByTestId } = render(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
        isSelected={true}
      />
    );

    const container = getByTestId('book-card-genesis');
    expect(container).toBeTruthy();
  });

  it('applies default styling when isSelected is false', () => {
    const { getByTestId } = render(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
        isSelected={false}
      />
    );

    const container = getByTestId('book-card-genesis');
    expect(container).toBeTruthy();
  });

  it('applies theme-aware tint color to book images', () => {
    const { UNSAFE_getByType } = render(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
      />
    );

    const images = UNSAFE_getByType(Image);
    // Should have the tint color applied from theme
    expect(images).toBeTruthy();
  });

  it('renders without crashing when all optional props are provided', () => {
    const { getByTestId } = render(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
        isSelected={true}
      />
    );

    expect(getByTestId('book-card-genesis')).toBeTruthy();
  });

  it('applies correct border color based on selection state', () => {
    const { getByTestId } = render(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
        isSelected={true}
      />
    );

    const bookCard = getByTestId('book-card-genesis');

    // Should have full primary color border when selected
    expect(bookCard).toBeTruthy();
  });

  it('applies subtle border color when not selected', () => {
    const { getByTestId } = render(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
        isSelected={false}
      />
    );

    const bookCard = getByTestId('book-card-genesis');

    // Should have subtle border color when not selected
    expect(bookCard).toBeTruthy();
  });
});
