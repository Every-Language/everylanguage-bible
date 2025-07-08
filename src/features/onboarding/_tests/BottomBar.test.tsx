import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BottomBar from '../components/BottomBar';

// Mock the theme hook
jest.mock('@/shared/store', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      primary: '#007AFF',
      secondary: '#8E8E93',
    },
    isDark: false,
  }),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock useTranslation for i18n
jest.mock('@/shared/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'onboarding.next': 'Next',
        'onboarding.finish': 'Finish',
      };
      return translations[key] || key;
    },
  }),
}));

describe('BottomBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<BottomBar scrollForward={jest.fn()} currentIndex={0} />);
    expect(true).toBe(true);
  });

  it('should render Next button on non-last slide', () => {
    const { getByText } = render(
      <BottomBar scrollForward={jest.fn()} currentIndex={0} />
    );
    const nextButton = getByText('Next');
    expect(nextButton).toBeTruthy();
  });

  it('should render Finish button on last slide', () => {
    const { getByText } = render(
      <BottomBar
        scrollForward={jest.fn()}
        currentIndex={5} // Last slide index
      />
    );
    const finishButton = getByText('Finish');
    expect(finishButton).toBeTruthy();
  });

  it('should call scrollForward when Next button is pressed', () => {
    const mockScrollForward = jest.fn();
    const { getByText } = render(
      <BottomBar scrollForward={mockScrollForward} currentIndex={0} />
    );

    const nextButton = getByText('Next');
    fireEvent.press(nextButton);

    expect(mockScrollForward).toHaveBeenCalled();
  });

  it('should navigate to Home when Finish button is pressed', () => {
    const { getByText } = render(
      <BottomBar
        scrollForward={jest.fn()}
        currentIndex={5} // Last slide index
      />
    );

    const finishButton = getByText('Finish');
    fireEvent.press(finishButton);

    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('should not show Next button on last slide', () => {
    const { queryByText } = render(
      <BottomBar
        scrollForward={jest.fn()}
        currentIndex={5} // Last slide index
      />
    );

    const nextButton = queryByText('Next');
    expect(nextButton).toBeNull();
  });

  it('should not show Finish button on non-last slide', () => {
    const { queryByText } = render(
      <BottomBar scrollForward={jest.fn()} currentIndex={0} />
    );

    const finishButton = queryByText('Finish');
    expect(finishButton).toBeNull();
  });
});
