import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OnboardingCard } from '../components/OnboardingCard';
import { AppProvider } from '@/app/providers';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>{children}</AppProvider>
);

describe('OnboardingCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with all props', () => {
    const { getByText } = render(
      <TestWrapper>
        <OnboardingCard
          title='Test Title'
          description='Test Description'
          onPress={mockOnPress}
          variant='primary'
        />
      </TestWrapper>
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <TestWrapper>
        <OnboardingCard
          title='Test Title'
          description='Test Description'
          onPress={mockOnPress}
        />
      </TestWrapper>
    );

    const card = getByText('Test Title');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders with icon when provided', () => {
    const { getByText } = render(
      <TestWrapper>
        <OnboardingCard
          title='Test Title'
          description='Test Description'
          onPress={mockOnPress}
          icon={<span>🚀</span>}
        />
      </TestWrapper>
    );

    expect(getByText('🚀')).toBeTruthy();
  });

  it('applies different styles for primary and secondary variants', () => {
    const { rerender, getByText } = render(
      <TestWrapper>
        <OnboardingCard
          title='Primary Card'
          description='Primary description'
          onPress={mockOnPress}
          variant='primary'
        />
      </TestWrapper>
    );

    expect(getByText('Primary Card')).toBeTruthy();

    rerender(
      <TestWrapper>
        <OnboardingCard
          title='Secondary Card'
          description='Secondary description'
          onPress={mockOnPress}
          variant='secondary'
        />
      </TestWrapper>
    );

    expect(getByText('Secondary Card')).toBeTruthy();
  });
});
