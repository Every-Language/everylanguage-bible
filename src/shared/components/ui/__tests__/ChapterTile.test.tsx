import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChapterTile } from '../ChapterTile';

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

describe('ChapterTile', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders chapter number correctly', () => {
    const { getByText } = render(
      <ChapterTile chapterNumber={5} onPress={mockOnPress} />
    );

    expect(getByText('5')).toBeTruthy();
  });

  it('calls onPress with correct chapter number when pressed', () => {
    const { getByRole } = render(
      <ChapterTile chapterNumber={10} onPress={mockOnPress} />
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledWith(10);
  });

  it('has correct accessibility properties', () => {
    const { getByRole } = render(
      <ChapterTile chapterNumber={3} onPress={mockOnPress} />
    );

    const button = getByRole('button');
    expect(button).toHaveProp('accessibilityLabel', 'Chapter 3');
  });

  it('renders with custom testID', () => {
    const { getByTestId } = render(
      <ChapterTile
        chapterNumber={7}
        onPress={mockOnPress}
        testID='custom-test-id'
      />
    );

    expect(getByTestId('custom-test-id')).toBeTruthy();
  });

  it('handles large chapter numbers correctly', () => {
    const { getByText } = render(
      <ChapterTile chapterNumber={150} onPress={mockOnPress} />
    );

    expect(getByText('150')).toBeTruthy();
  });

  it('highlights border when selected', () => {
    const { getByTestId } = render(
      <ChapterTile
        chapterNumber={5}
        onPress={mockOnPress}
        testID='chapter-tile'
        isSelected={true}
      />
    );

    const chapterTile = getByTestId('chapter-tile');

    // Should have full primary color border when selected
    expect(chapterTile.props.style.borderColor).toBe(
      mockUseTheme.colors.primary
    );
  });

  it('uses subtle border when not selected', () => {
    const { getByTestId } = render(
      <ChapterTile
        chapterNumber={5}
        onPress={mockOnPress}
        testID='chapter-tile'
        isSelected={false}
      />
    );

    const chapterTile = getByTestId('chapter-tile');

    // Should have subtle border color when not selected
    expect(chapterTile.props.style.borderColor).toBe(
      mockUseTheme.colors.primary + '20'
    );
  });
});
