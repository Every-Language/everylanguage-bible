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

  it('renders book title correctly', () => {
    const { getByText } = render(
      <BookCard title='Genesis' onPress={mockOnPress} />
    );

    expect(getByText('Genesis')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(
      <BookCard title='Genesis' onPress={mockOnPress} testID='book-card' />
    );

    const card = getByTestId('book-card');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders without image when imagePath is not provided', () => {
    const { getByText } = render(
      <BookCard title='Genesis' onPress={mockOnPress} />
    );

    // Should render the fallback icon
    expect(getByText('📖')).toBeTruthy();
  });

  it('truncates long titles properly', () => {
    const longTitle = 'This is a very long book title that should be truncated';
    const { getByText } = render(
      <BookCard title={longTitle} onPress={mockOnPress} />
    );

    expect(getByText(longTitle)).toBeTruthy();
  });

  it('has proper accessibility properties', () => {
    const { getByTestId } = render(
      <BookCard title='Genesis' onPress={mockOnPress} testID='book-card' />
    );

    const card = getByTestId('book-card');
    expect(card.props.accessibilityRole).toBe('button');
  });

  it('applies theme-aware tint color to book images', () => {
    const { UNSAFE_getByType } = render(
      <BookCard
        title='Genesis'
        imagePath='01_genesis.png'
        onPress={mockOnPress}
      />
    );

    // Find the Image component
    const imageComponent = UNSAFE_getByType(Image);

    // Check that the tintColor matches the theme text color
    expect(imageComponent.props.style.tintColor).toBe(mockUseTheme.colors.text);
  });

  it('adapts icon color for dark theme', () => {
    // Mock dark theme
    mockUseTheme.colors.text = '#EBE5D9'; // White text for dark mode

    const { UNSAFE_getByType } = render(
      <BookCard
        title='Genesis'
        imagePath='01_genesis.png'
        onPress={mockOnPress}
      />
    );

    const imageComponent = UNSAFE_getByType(Image);

    // Should use white text color for dark mode
    expect(imageComponent.props.style.tintColor).toBe('#EBE5D9');
  });

  it('highlights border when selected', () => {
    const { getByTestId } = render(
      <BookCard
        title='Genesis'
        imagePath='01_genesis.png'
        onPress={mockOnPress}
        testID='book-card'
        isSelected={true}
      />
    );

    const bookCard = getByTestId('book-card');

    // Should have full primary color border when selected
    expect(bookCard.props.style.borderColor).toBe(mockUseTheme.colors.primary);
  });

  it('uses subtle border when not selected', () => {
    const { getByTestId } = render(
      <BookCard
        title='Genesis'
        imagePath='01_genesis.png'
        onPress={mockOnPress}
        testID='book-card'
        isSelected={false}
      />
    );

    const bookCard = getByTestId('book-card');

    // Should have subtle border color when not selected
    expect(bookCard.props.style.borderColor).toBe(
      mockUseTheme.colors.primary + '20'
    );
  });
});
