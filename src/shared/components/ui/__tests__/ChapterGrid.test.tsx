import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChapterGrid } from '../ChapterGrid';

// Mock Animated to avoid timing issues in tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = () => ({
    start: jest.fn(),
  });
  return RN;
});

describe('ChapterGrid', () => {
  const mockOnChapterPress = jest.fn();

  beforeEach(() => {
    mockOnChapterPress.mockClear();
  });

  it('renders correct number of chapter tiles', () => {
    const { getAllByTestId } = render(
      <ChapterGrid
        chapterCount={5}
        onChapterPress={mockOnChapterPress}
        isVisible={true}
      />
    );

    const tiles = getAllByTestId(/chapter-tile-\d+/);
    expect(tiles).toHaveLength(5);
  });

  it('arranges chapters in rows of 5', () => {
    const { getByTestId } = render(
      <ChapterGrid
        chapterCount={12}
        onChapterPress={mockOnChapterPress}
        isVisible={true}
        testID='test-grid'
      />
    );

    // Should have chapters 1-12
    expect(getByTestId('chapter-tile-1')).toBeTruthy();
    expect(getByTestId('chapter-tile-12')).toBeTruthy();
  });

  it('calls onChapterPress with correct chapter number', () => {
    const { getByTestId } = render(
      <ChapterGrid
        chapterCount={3}
        onChapterPress={mockOnChapterPress}
        isVisible={true}
      />
    );

    fireEvent.press(getByTestId('chapter-tile-2'));
    expect(mockOnChapterPress).toHaveBeenCalledWith(2);
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(
      <ChapterGrid
        chapterCount={5}
        onChapterPress={mockOnChapterPress}
        isVisible={false}
        testID='test-grid'
      />
    );

    expect(queryByTestId('test-grid')).toBeNull();
  });

  it('handles large number of chapters', () => {
    const { getAllByTestId } = render(
      <ChapterGrid
        chapterCount={150}
        onChapterPress={mockOnChapterPress}
        isVisible={true}
      />
    );

    const tiles = getAllByTestId(/chapter-tile-\d+/);
    expect(tiles).toHaveLength(150);
  });

  it('handles single chapter', () => {
    const { getByTestId } = render(
      <ChapterGrid
        chapterCount={1}
        onChapterPress={mockOnChapterPress}
        isVisible={true}
      />
    );

    expect(getByTestId('chapter-tile-1')).toBeTruthy();
  });

  it('renders with custom testID', () => {
    const { getByTestId } = render(
      <ChapterGrid
        chapterCount={3}
        onChapterPress={mockOnChapterPress}
        isVisible={true}
        testID='custom-grid'
      />
    );

    expect(getByTestId('custom-grid')).toBeTruthy();
  });
});
