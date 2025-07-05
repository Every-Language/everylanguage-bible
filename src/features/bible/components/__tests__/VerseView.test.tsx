import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VerseView } from '../VerseView';
import { useVerseViewStore } from '@/shared/store';
import { getBookImageSource } from '@/shared/services';

// Mock Tamagui components to avoid configuration issues
jest.mock('@tamagui/core', () => ({
  styled: () => () => 'View',
  Stack: 'View',
  Text: 'Text',
  Button: 'TouchableOpacity',
  Card: 'View',
  XStack: 'View',
  YStack: 'View',
  ScrollView: 'ScrollView',
}));

jest.mock('@tamagui/button', () => ({
  Button: 'TouchableOpacity',
}));

jest.mock('@tamagui/card', () => ({
  Card: 'View',
}));

jest.mock('@tamagui/stacks', () => ({
  Stack: 'View',
  XStack: 'View',
  YStack: 'View',
}));

jest.mock('@tamagui/text', () => ({
  Text: 'Text',
}));

jest.mock('@tamagui/image', () => ({
  Image: 'Image',
}));

// Mock the stores and services
jest.mock('@/shared/store', () => ({
  useVerseViewStore: jest.fn(),
  useTheme: () => ({
    colors: {
      background: '#ffffff',
      text: '#000000',
      primary: '#007AFF',
      secondary: '#8E8E93',
    },
  }),
}));

jest.mock('@/shared/services', () => ({
  getBookImageSource: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockUseVerseViewStore = useVerseViewStore as jest.MockedFunction<
  typeof useVerseViewStore
>;
const mockGetBookImageSource = getBookImageSource as jest.MockedFunction<
  typeof getBookImageSource
>;

describe('VerseView', () => {
  const mockBook = {
    id: '01',
    name: 'Genesis',
    testament: 'old' as const,
    chapters: 50,
    order: 1,
    imagePath: '01_genesis.png',
  };

  const mockOnVerseSelect = jest.fn();
  const mockOnChapterSelect = jest.fn();

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(ui);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBookImageSource.mockReturnValue({ uri: 'test-image.png' });
  });

  it('should not render when not open', () => {
    mockUseVerseViewStore.mockReturnValue({
      isOpen: false,
      selectedBook: null,
      selectedChapter: null,
      openVerseView: jest.fn(),
      closeVerseView: jest.fn(),
    });

    const { queryByTestId } = renderWithProvider(
      <VerseView
        onVerseSelect={mockOnVerseSelect}
        onChapterSelect={mockOnChapterSelect}
      />
    );

    expect(queryByTestId('close-button')).toBeNull();
  });

  it('should render when open with selected book and chapter', () => {
    mockUseVerseViewStore.mockReturnValue({
      isOpen: true,
      selectedBook: mockBook,
      selectedChapter: 1,
      openVerseView: jest.fn(),
      closeVerseView: jest.fn(),
    });

    const { getByTestId, getByText } = renderWithProvider(
      <VerseView
        onVerseSelect={mockOnVerseSelect}
        onChapterSelect={mockOnChapterSelect}
      />
    );

    expect(getByTestId('close-button')).toBeTruthy();
    expect(getByText('Genesis - Chapter 1')).toBeTruthy();
  });

  it('should display verse items', () => {
    mockUseVerseViewStore.mockReturnValue({
      isOpen: true,
      selectedBook: mockBook,
      selectedChapter: 1,
      openVerseView: jest.fn(),
      closeVerseView: jest.fn(),
    });

    const { getByTestId, getByText } = renderWithProvider(
      <VerseView
        onVerseSelect={mockOnVerseSelect}
        onChapterSelect={mockOnChapterSelect}
      />
    );

    // Should display verse items (the dummy function generates 15-49 verses)
    expect(getByTestId('verse-tile-1')).toBeTruthy();
    expect(getByText('Verse 1')).toBeTruthy();
  });

  it('should handle verse selection', () => {
    const mockCloseVerseView = jest.fn();
    mockUseVerseViewStore.mockReturnValue({
      isOpen: true,
      selectedBook: mockBook,
      selectedChapter: 1,
      openVerseView: jest.fn(),
      closeVerseView: mockCloseVerseView,
    });

    const { getByTestId } = renderWithProvider(
      <VerseView
        onVerseSelect={mockOnVerseSelect}
        onChapterSelect={mockOnChapterSelect}
      />
    );

    const verseTile = getByTestId('verse-tile-1');
    fireEvent.press(verseTile);

    expect(mockOnVerseSelect).toHaveBeenCalledWith(mockBook, 1, 1);
  });

  it('should handle close button press', () => {
    const mockCloseVerseView = jest.fn();
    mockUseVerseViewStore.mockReturnValue({
      isOpen: true,
      selectedBook: mockBook,
      selectedChapter: 1,
      openVerseView: jest.fn(),
      closeVerseView: mockCloseVerseView,
    });

    const { getByTestId } = renderWithProvider(
      <VerseView
        onVerseSelect={mockOnVerseSelect}
        onChapterSelect={mockOnChapterSelect}
      />
    );

    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(mockCloseVerseView).toHaveBeenCalled();
  });

  it('should handle play chapter button press', () => {
    mockUseVerseViewStore.mockReturnValue({
      isOpen: true,
      selectedBook: mockBook,
      selectedChapter: 1,
      openVerseView: jest.fn(),
      closeVerseView: jest.fn(),
    });

    const { getByTestId } = renderWithProvider(
      <VerseView
        onVerseSelect={mockOnVerseSelect}
        onChapterSelect={mockOnChapterSelect}
      />
    );

    const playButton = getByTestId('play-chapter-button');
    fireEvent.press(playButton);

    expect(mockOnChapterSelect).toHaveBeenCalledWith(mockBook, 1);
  });

  it('should display fallback icon when no image path', () => {
    const bookWithoutImage = { ...mockBook, imagePath: undefined };
    mockUseVerseViewStore.mockReturnValue({
      isOpen: true,
      selectedBook: bookWithoutImage,
      selectedChapter: 1,
      openVerseView: jest.fn(),
      closeVerseView: jest.fn(),
    });

    const { getByText } = renderWithProvider(
      <VerseView
        onVerseSelect={mockOnVerseSelect}
        onChapterSelect={mockOnChapterSelect}
      />
    );

    expect(getByText('📖')).toBeTruthy();
  });

  it('should display fallback icon when image source is not found', () => {
    mockGetBookImageSource.mockReturnValue(undefined);
    mockUseVerseViewStore.mockReturnValue({
      isOpen: true,
      selectedBook: mockBook,
      selectedChapter: 1,
      openVerseView: jest.fn(),
      closeVerseView: jest.fn(),
    });

    const { getByText } = renderWithProvider(
      <VerseView
        onVerseSelect={mockOnVerseSelect}
        onChapterSelect={mockOnChapterSelect}
      />
    );

    expect(getByText('📖')).toBeTruthy();
  });
});
