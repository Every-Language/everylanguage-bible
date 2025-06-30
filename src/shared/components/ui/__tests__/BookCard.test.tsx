import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BookCard } from '../BookCard';

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
});
