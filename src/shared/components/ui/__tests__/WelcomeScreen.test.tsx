import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WelcomeScreen } from '../WelcomeScreen';

describe('WelcomeScreen', () => {
  it('renders welcome content correctly', () => {
    const mockOnGetStarted = jest.fn();

    const { getByText } = render(
      <WelcomeScreen onGetStarted={mockOnGetStarted} />
    );

    expect(getByText('Welcome to El Bible')).toBeTruthy();
    expect(
      getByText('Experience the Bible in every language with audio narration')
    ).toBeTruthy();
    expect(
      getByText(/Discover God's word through multilingual audio Bible readings/)
    ).toBeTruthy();
  });

  it('calls onGetStarted when button is pressed', () => {
    const mockOnGetStarted = jest.fn();

    const { getByText } = render(
      <WelcomeScreen onGetStarted={mockOnGetStarted} />
    );

    const button = getByText('Get Started');
    fireEvent.press(button);

    expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility labels', () => {
    const mockOnGetStarted = jest.fn();

    const { getByLabelText } = render(
      <WelcomeScreen onGetStarted={mockOnGetStarted} />
    );

    expect(getByLabelText('Get started with El Bible')).toBeTruthy();
  });
});
