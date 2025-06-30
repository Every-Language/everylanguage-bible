import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MiniPlayer } from '../MiniPlayer';

describe('MiniPlayer', () => {
  const defaultProps = {
    title: 'Genesis 1',
    subtitle: 'In the beginning...',
    isPlaying: false,
    onPlayPause: jest.fn(),
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    onExpand: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and subtitle correctly', () => {
    const { getByText } = render(<MiniPlayer {...defaultProps} />);

    expect(getByText('Genesis 1')).toBeTruthy();
    expect(getByText('In the beginning...')).toBeTruthy();
  });

  it('shows play icon when not playing', () => {
    const { getByText } = render(
      <MiniPlayer {...defaultProps} isPlaying={false} />
    );

    expect(getByText('▶️')).toBeTruthy();
  });

  it('shows pause icon when playing', () => {
    const { getByText } = render(
      <MiniPlayer {...defaultProps} isPlaying={true} />
    );

    expect(getByText('⏸')).toBeTruthy();
  });

  it('calls onPlayPause when play button is pressed', () => {
    const { getByTestId } = render(<MiniPlayer {...defaultProps} />);

    const playButton = getByTestId('mini-player-play-pause');
    fireEvent.press(playButton);

    expect(defaultProps.onPlayPause).toHaveBeenCalledTimes(1);
  });

  it('calls onPrevious when previous button is pressed', () => {
    const { getByTestId } = render(<MiniPlayer {...defaultProps} />);

    const previousButton = getByTestId('mini-player-previous');
    fireEvent.press(previousButton);

    expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when next button is pressed', () => {
    const { getByTestId } = render(<MiniPlayer {...defaultProps} />);

    const nextButton = getByTestId('mini-player-next');
    fireEvent.press(nextButton);

    expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onExpand when container is pressed', () => {
    const { getByTestId } = render(
      <MiniPlayer {...defaultProps} testID='mini-player' />
    );

    const container = getByTestId('mini-player');
    fireEvent.press(container);

    expect(defaultProps.onExpand).toHaveBeenCalledTimes(1);
  });

  it('renders fallback icon when no image is provided', () => {
    const { getByText } = render(<MiniPlayer {...defaultProps} />);

    expect(getByText('🎵')).toBeTruthy();
  });

  it('displays default title when no title is provided', () => {
    const propsWithoutTitle = {
      isPlaying: false,
      onPlayPause: jest.fn(),
      onPrevious: jest.fn(),
      onNext: jest.fn(),
      onExpand: jest.fn(),
    };
    const { getByText } = render(<MiniPlayer {...propsWithoutTitle} />);

    expect(getByText('No audio selected')).toBeTruthy();
  });

  it('has proper accessibility labels', () => {
    const { getByLabelText } = render(<MiniPlayer {...defaultProps} />);

    expect(getByLabelText('Audio player controls')).toBeTruthy();
    expect(getByLabelText('Play')).toBeTruthy();
    expect(getByLabelText('Previous verse')).toBeTruthy();
    expect(getByLabelText('Next verse')).toBeTruthy();
  });
});
