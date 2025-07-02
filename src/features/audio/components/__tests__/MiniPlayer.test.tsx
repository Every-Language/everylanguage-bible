import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MiniPlayer } from '../MiniPlayer';

// Mock the theme and translation hooks
jest.mock('@/shared/store', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      primary: '#007AFF',
      secondary: '#8E8E93',
    },
  }),
}));

jest.mock('@/shared/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'audio.noAudioSelected': 'No audio selected',
        'audio.audioPlayerControls': 'Audio player controls',
        'audio.play': 'Play',
        'audio.pause': 'Pause',
        'audio.previousChapter': 'Previous chapter',
        'audio.nextChapter': 'Next chapter',
        'audio.previousVerse': 'Previous verse',
        'audio.nextVerse': 'Next verse',
        'audio.expandPlayer': 'Expand player',
        'audio.closePlayer': 'Close player',
      };
      return translations[key] || key;
    },
  }),
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

// Mock the icon components
jest.mock('@/shared/components/ui/icons/AudioIcons', () => ({
  PlayIcon: () => null,
  PauseIcon: () => null,
  PreviousChapterIcon: () => null,
  NextChapterIcon: () => null,
  PreviousVerseIcon: () => null,
  NextVerseIcon: () => null,
  ChevronDownIcon: () => null,
}));

// Mock the ProgressBar component
jest.mock('@/shared/components/ui/ProgressBar', () => ({
  ProgressBar: () => null,
}));

describe('MiniPlayer', () => {
  const defaultProps = {
    title: 'Genesis 1',
    subtitle: 'In the beginning...',
    isPlaying: false,
    currentTime: 0,
    totalTime: 0,
    onPlayPause: jest.fn(),
    onPreviousChapter: jest.fn(),
    onNextChapter: jest.fn(),
    onPreviousVerse: jest.fn(),
    onNextVerse: jest.fn(),
    onSeek: jest.fn(),
    onExpand: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    const { getByText, getByLabelText } = render(
      <MiniPlayer {...defaultProps} />
    );

    expect(getByText('Genesis 1')).toBeTruthy();
    expect(getByText('In the beginning...')).toBeTruthy();
    expect(getByLabelText('Audio player controls')).toBeTruthy();
  });

  it('renders play accessibility label when not playing', () => {
    const { getByLabelText } = render(
      <MiniPlayer {...defaultProps} isPlaying={false} />
    );

    expect(getByLabelText('Play')).toBeTruthy();
  });

  it('renders pause accessibility label when playing', () => {
    const { getByLabelText } = render(
      <MiniPlayer {...defaultProps} isPlaying={true} />
    );

    expect(getByLabelText('Pause')).toBeTruthy();
  });

  it('calls onPlayPause when play button is pressed', () => {
    const mockOnPlayPause = jest.fn();
    const { getByTestId } = render(
      <MiniPlayer {...defaultProps} onPlayPause={mockOnPlayPause} />
    );

    fireEvent.press(getByTestId('mini-player-play-pause'));
    expect(mockOnPlayPause).toHaveBeenCalledTimes(1);
  });

  it('calls onPreviousChapter when previous chapter button is pressed', () => {
    const mockOnPreviousChapter = jest.fn();
    const { getByTestId } = render(
      <MiniPlayer {...defaultProps} onPreviousChapter={mockOnPreviousChapter} />
    );

    fireEvent.press(getByTestId('mini-player-previous-chapter'));
    expect(mockOnPreviousChapter).toHaveBeenCalledTimes(1);
  });

  it('calls onNextChapter when next chapter button is pressed', () => {
    const mockOnNextChapter = jest.fn();
    const { getByTestId } = render(
      <MiniPlayer {...defaultProps} onNextChapter={mockOnNextChapter} />
    );

    fireEvent.press(getByTestId('mini-player-next-chapter'));
    expect(mockOnNextChapter).toHaveBeenCalledTimes(1);
  });

  it('calls onPreviousVerse when previous verse button is pressed', () => {
    const mockOnPreviousVerse = jest.fn();
    const { getByTestId } = render(
      <MiniPlayer {...defaultProps} onPreviousVerse={mockOnPreviousVerse} />
    );

    fireEvent.press(getByTestId('mini-player-previous-verse'));
    expect(mockOnPreviousVerse).toHaveBeenCalledTimes(1);
  });

  it('calls onNextVerse when next verse button is pressed', () => {
    const mockOnNextVerse = jest.fn();
    const { getByTestId } = render(
      <MiniPlayer {...defaultProps} onNextVerse={mockOnNextVerse} />
    );

    fireEvent.press(getByTestId('mini-player-next-verse'));
    expect(mockOnNextVerse).toHaveBeenCalledTimes(1);
  });

  it('calls onExpand when expand button is pressed', () => {
    const mockOnExpand = jest.fn();
    const { getByLabelText } = render(
      <MiniPlayer {...defaultProps} onExpand={mockOnExpand} />
    );

    fireEvent.press(getByLabelText('Expand player'));
    expect(mockOnExpand).toHaveBeenCalledTimes(1);
  });

  it('renders fallback icon when no image is provided', () => {
    const { getByText } = render(<MiniPlayer {...defaultProps} />);

    expect(getByText('📖')).toBeTruthy();
  });

  it('displays default title when no title is provided', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { title, ...propsWithoutTitle } = defaultProps;
    const { getByText } = render(<MiniPlayer {...propsWithoutTitle} />);

    expect(getByText('No audio selected')).toBeTruthy();
  });

  it('has proper accessibility labels for all controls', () => {
    const { getByLabelText } = render(<MiniPlayer {...defaultProps} />);

    expect(getByLabelText('Audio player controls')).toBeTruthy();
    expect(getByLabelText('Play')).toBeTruthy();
    expect(getByLabelText('Previous chapter')).toBeTruthy();
    expect(getByLabelText('Next chapter')).toBeTruthy();
    expect(getByLabelText('Previous verse')).toBeTruthy();
    expect(getByLabelText('Next verse')).toBeTruthy();
    expect(getByLabelText('Expand player')).toBeTruthy();
  });

  it('calls onClose when chapter subtitle is tapped', () => {
    const mockOnClose = jest.fn();
    const { getByTestId } = render(
      <MiniPlayer {...defaultProps} onClose={mockOnClose} />
    );

    fireEvent.press(getByTestId('mini-player-close-subtitle'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when no subtitle provided', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { subtitle, ...propsWithoutSubtitle } = defaultProps;
    const { queryByTestId } = render(<MiniPlayer {...propsWithoutSubtitle} />);

    expect(queryByTestId('mini-player-close-subtitle')).toBeNull();
  });
});
