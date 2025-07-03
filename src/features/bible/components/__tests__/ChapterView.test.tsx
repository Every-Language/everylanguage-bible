import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChapterView } from '../ChapterView';

// Mock Tamagui components
jest.mock('@tamagui/core', () => ({
  Stack: 'View',
  Text: 'Text',
}));

jest.mock('@tamagui/card', () => ({
  Card: 'TouchableOpacity',
}));

jest.mock('@tamagui/button', () => ({
  Button: 'TouchableOpacity',
}));

jest.mock('@tamagui/image', () => ({
  Image: 'Image',
}));

// Mock the safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

// Mock the theme store
const mockUseTheme = {
  colors: {
    background: '#EBE5D9',
    text: '#070707',
    primary: '#264854',
    secondary: '#AD915A',
  },
};

// Mock the chapter view store
const mockUseChapterViewStore = {
  isOpen: false,
  selectedBook: null as any,
  closeChapterView: jest.fn(),
};

jest.mock('@/shared/store', () => ({
  useTheme: () => mockUseTheme,
  useChapterViewStore: () => mockUseChapterViewStore,
}));

// Mock the services
jest.mock('@/shared/services', () => ({
  getBookImageSource: () => ({ uri: 'test-image.png' }),
}));

// Mock the audio icons
jest.mock('@/shared/components/ui/icons/AudioIcons', () => ({
  PlayIcon: 'PlayIcon',
  PlusIcon: 'PlusIcon',
}));

describe('ChapterView', () => {
  const mockOnChapterSelect = jest.fn();

  beforeEach(() => {
    mockOnChapterSelect.mockClear();
    mockUseChapterViewStore.closeChapterView.mockClear();
    mockUseChapterViewStore.isOpen = false;
    mockUseChapterViewStore.selectedBook = null;
  });

  it('renders nothing when not open', () => {
    const { queryByText } = render(
      <ChapterView onChapterSelect={mockOnChapterSelect} />
    );

    expect(queryByText('Genesis')).toBeNull();
  });

  it('renders nothing when no book is selected', () => {
    mockUseChapterViewStore.isOpen = true;
    mockUseChapterViewStore.selectedBook = null;

    const { queryByText } = render(
      <ChapterView onChapterSelect={mockOnChapterSelect} />
    );

    expect(queryByText('Genesis')).toBeNull();
  });

  it('renders book information when open and book is selected', () => {
    mockUseChapterViewStore.isOpen = true;
    mockUseChapterViewStore.selectedBook = {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: '01_genesis.png',
    };

    const { getByText } = render(
      <ChapterView onChapterSelect={mockOnChapterSelect} />
    );

    expect(getByText('Genesis')).toBeTruthy();
    expect(getByText('50 chapters • Old Testament • 8h 20m')).toBeTruthy();
  });

  it('renders chapter items for all chapters', () => {
    mockUseChapterViewStore.isOpen = true;
    mockUseChapterViewStore.selectedBook = {
      id: 'gen',
      name: 'Genesis',
      chapters: 3, // Small number for testing
      testament: 'old',
      imagePath: '01_genesis.png',
    };

    const { getByText } = render(
      <ChapterView onChapterSelect={mockOnChapterSelect} />
    );

    expect(getByText('Chapter 1')).toBeTruthy();
    expect(getByText('Chapter 2')).toBeTruthy();
    expect(getByText('Chapter 3')).toBeTruthy();
  });

  it('calls onChapterSelect when a chapter is pressed', () => {
    mockUseChapterViewStore.isOpen = true;
    mockUseChapterViewStore.selectedBook = {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: '01_genesis.png',
    };

    const { getByTestId } = render(
      <ChapterView onChapterSelect={mockOnChapterSelect} />
    );

    // Find the first chapter tile and press it
    const chapterTile = getByTestId('chapter-tile-1');
    fireEvent.press(chapterTile);

    expect(mockOnChapterSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'gen', name: 'Genesis' }),
      1
    );
  });

  it('calls closeChapterView when close button is pressed', () => {
    mockUseChapterViewStore.isOpen = true;
    mockUseChapterViewStore.selectedBook = {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: '01_genesis.png',
    };

    const { getByTestId } = render(
      <ChapterView onChapterSelect={mockOnChapterSelect} />
    );

    // Find the close button (it's a Button component)
    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(mockUseChapterViewStore.closeChapterView).toHaveBeenCalled();
  });

  it('calls onChapterSelect when play book button is pressed', () => {
    mockUseChapterViewStore.isOpen = true;
    mockUseChapterViewStore.selectedBook = {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: '01_genesis.png',
    };

    const { getByTestId } = render(
      <ChapterView onChapterSelect={mockOnChapterSelect} />
    );

    const playBookButton = getByTestId('play-book-button');
    fireEvent.press(playBookButton);

    expect(mockOnChapterSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'gen', name: 'Genesis' }),
      1
    );
  });

  it('displays correct testament information for new testament', () => {
    mockUseChapterViewStore.isOpen = true;
    mockUseChapterViewStore.selectedBook = {
      id: 'mat',
      name: 'Matthew',
      chapters: 28,
      testament: 'new',
      imagePath: '40_matthew.png',
    };

    const { getByText } = render(
      <ChapterView onChapterSelect={mockOnChapterSelect} />
    );

    expect(getByText('28 chapters • New Testament • 4h 40m')).toBeTruthy();
  });

  it('displays fallback icon when no image path is provided', () => {
    mockUseChapterViewStore.isOpen = true;
    mockUseChapterViewStore.selectedBook = {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: null,
    };

    const { getByText } = render(
      <ChapterView onChapterSelect={mockOnChapterSelect} />
    );

    expect(getByText('📖')).toBeTruthy();
  });

  it('generates consistent verse counts for chapters', () => {
    mockUseChapterViewStore.isOpen = true;
    mockUseChapterViewStore.selectedBook = {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: '01_genesis.png',
    };

    const { getAllByText } = render(
      <ChapterView onChapterSelect={mockOnChapterSelect} />
    );

    // Chapter 1 should have a specific verse count based on the algorithm
    // (15 + (1 * 7) % 35) = 15 + 7 = 22
    const verseCountElements = getAllByText('22 verses');
    expect(verseCountElements.length).toBeGreaterThan(0);
  });

  it('calculates playback time correctly for different chapter counts', () => {
    mockUseChapterViewStore.isOpen = true;
    mockUseChapterViewStore.selectedBook = {
      id: 'psa',
      name: 'Psalms',
      chapters: 150,
      testament: 'old',
      imagePath: '19_psalms.png',
    };

    const { getByText } = render(
      <ChapterView onChapterSelect={mockOnChapterSelect} />
    );

    // 150 chapters * 10 minutes = 1500 minutes = 25 hours
    expect(getByText('150 chapters • Old Testament • 25h 0m')).toBeTruthy();
  });
});
