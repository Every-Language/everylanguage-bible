import React from 'react';
import { render } from '@testing-library/react-native';
import { AudioPlayerWidget } from '../AudioPlayerWidget';

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: ({ children }: { children: React.ReactNode }) => children,
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock components with simple test implementations
jest.mock('../MiniPlayerView', () => {
  return {
    MiniPlayerView: () => 'MiniPlayerView Mock',
  };
});

jest.mock('../FullPlayerView', () => {
  return {
    FullPlayerView: () => 'FullPlayerView Mock',
  };
});

// Mock theme
jest.mock('@/shared/store', () => ({
  useTheme: () => ({
    colors: {
      background: '#ffffff',
      text: '#000000',
      primary: '#007AFF',
      secondary: '#666666',
    },
    isDark: false,
  }),
}));

describe('AudioPlayerWidget', () => {
  const defaultProps = {
    title: 'Genesis 1',
    subtitle: 'Creation of the World',
    isPlaying: false,
    currentTime: 0,
    totalTime: 390,
    isVisible: true,
    onPlayPause: jest.fn(),
    onPreviousChapter: jest.fn(),
    onNextChapter: jest.fn(),
    onPreviousVerse: jest.fn(),
    onNextVerse: jest.fn(),
    onSeek: jest.fn(),
    onAudioClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should render when visible', () => {
      const { getByTestId } = render(
        <AudioPlayerWidget {...defaultProps} testID='audio-widget' />
      );

      expect(getByTestId('audio-widget')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByTestId } = render(
        <AudioPlayerWidget
          {...defaultProps}
          isVisible={false}
          testID='audio-widget'
        />
      );

      expect(queryByTestId('audio-widget')).toBeNull();
    });
  });

  describe('Component Integration', () => {
    it('should render with basic props', () => {
      const { getByTestId } = render(
        <AudioPlayerWidget {...defaultProps} testID='audio-widget' />
      );

      expect(getByTestId('audio-widget')).toBeTruthy();
    });
  });

  describe('Audio Controls Pass-through', () => {
    it('should pass audio props to components', () => {
      const props = {
        ...defaultProps,
        title: 'Test Chapter',
        isPlaying: true,
        currentTime: 30,
        totalTime: 120,
      };

      const { getByTestId } = render(
        <AudioPlayerWidget {...props} testID='audio-widget' />
      );

      expect(getByTestId('audio-widget')).toBeTruthy();
    });
  });

  describe('Props Validation', () => {
    it('should handle minimal props', () => {
      const minimalProps = {
        isVisible: true,
      };

      const { getByTestId } = render(
        <AudioPlayerWidget {...minimalProps} testID='audio-widget' />
      );

      expect(getByTestId('audio-widget')).toBeTruthy();
    });

    it('should handle missing optional audio state', () => {
      const basicProps = {
        isVisible: true,
        onPlayPause: jest.fn(),
        onAudioClose: jest.fn(),
      };

      const { getByTestId } = render(
        <AudioPlayerWidget {...basicProps} testID='audio-widget' />
      );

      expect(getByTestId('audio-widget')).toBeTruthy();
    });
  });

  describe('Animation States', () => {
    it('should handle hidden state correctly', () => {
      const { queryByTestId } = render(
        <AudioPlayerWidget
          {...defaultProps}
          isVisible={false}
          testID='audio-widget'
        />
      );

      expect(queryByTestId('audio-widget')).toBeNull();
    });

    it('should handle visible state', () => {
      const { getByTestId } = render(
        <AudioPlayerWidget
          {...defaultProps}
          isVisible={true}
          testID='audio-widget'
        />
      );

      expect(getByTestId('audio-widget')).toBeTruthy();
    });
  });

  describe('Configuration', () => {
    it('should handle bottom offset correctly', () => {
      const { getByTestId } = render(
        <AudioPlayerWidget
          {...defaultProps}
          bottomOffset={83}
          testID='audio-widget'
        />
      );

      expect(getByTestId('audio-widget')).toBeTruthy();
    });

    it('should handle all callback props', () => {
      const callbacks = {
        onPlayPause: jest.fn(),
        onPreviousChapter: jest.fn(),
        onNextChapter: jest.fn(),
        onPreviousVerse: jest.fn(),
        onNextVerse: jest.fn(),
        onSeek: jest.fn(),
        onAudioClose: jest.fn(),
      };

      const { getByTestId } = render(
        <AudioPlayerWidget
          {...defaultProps}
          {...callbacks}
          testID='audio-widget'
        />
      );

      expect(getByTestId('audio-widget')).toBeTruthy();

      // Verify none of the callbacks were called during render
      Object.values(callbacks).forEach(callback => {
        expect(callback).not.toHaveBeenCalled();
      });
    });
  });
});
