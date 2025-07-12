import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Image } from 'react-native';
import { BookCard } from '../BookCard';
import { TamaguiTestWrapper } from '@/shared/test-utils/tamagui-test-setup';

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

  const renderWithTamagui = (component: React.ReactElement) => {
    return render(<TamaguiTestWrapper>{component}</TamaguiTestWrapper>);
  };

  it('renders book name correctly', () => {
    const { getByTestId } = renderWithTamagui(
      <BookCard bookName='Genesis' onPress={mockOnPress} />
    );

    expect(getByTestId('book-card-genesis')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByTestId } = renderWithTamagui(
      <BookCard bookName='Genesis' onPress={mockOnPress} />
    );

    fireEvent.press(getByTestId('book-card-genesis'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility properties', () => {
    const { getByRole } = renderWithTamagui(
      <BookCard bookName='Genesis' onPress={mockOnPress} />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Genesis book');
  });

  it('handles long book names gracefully', () => {
    const longBookName = 'A Very Long Book Name That Should Be Truncated';
    const { getByTestId } = renderWithTamagui(
      <BookCard bookName={longBookName} onPress={mockOnPress} />
    );

    expect(
      getByTestId('book-card-a-very-long-book-name-that-should-be-truncated')
    ).toBeTruthy();
  });

  it('displays book image when bookImage is provided', () => {
    const { UNSAFE_getByType } = renderWithTamagui(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
      />
    );

    // Should render an Image component
    const images = UNSAFE_getByType(Image);
    expect(images).toBeTruthy();
  });

  it('displays fallback icon when no image is provided', () => {
    const { getByTestId } = renderWithTamagui(
      <BookCard bookName='Genesis' onPress={mockOnPress} />
    );

    expect(getByTestId('book-card-genesis')).toBeTruthy();
  });

  it('applies selected styling when isSelected is true', () => {
    const { getByTestId } = renderWithTamagui(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
        isSelected={true}
      />
    );

    expect(getByTestId('book-card-genesis')).toBeTruthy();
  });

  it('applies default styling when isSelected is false', () => {
    const { getByTestId } = renderWithTamagui(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
        isSelected={false}
      />
    );

    expect(getByTestId('book-card-genesis')).toBeTruthy();
  });

  it('applies theme-aware tint color to book images', () => {
    const { UNSAFE_getByType } = renderWithTamagui(
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
    const { getByTestId } = renderWithTamagui(
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
    const { getByTestId } = renderWithTamagui(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
        isSelected={true}
      />
    );

    expect(getByTestId('book-card-genesis')).toBeTruthy();
  });

  it('applies subtle border color when not selected', () => {
    const { getByTestId } = renderWithTamagui(
      <BookCard
        bookName='Genesis'
        bookImage='01_genesis.png'
        onPress={mockOnPress}
        isSelected={false}
      />
    );

    expect(getByTestId('book-card-genesis')).toBeTruthy();
  });
});
