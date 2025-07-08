import React from 'react';
import { render } from '@testing-library/react-native';
import { MediaPlayerAdvancedPanel } from '../MediaPlayerAdvancedPanel';

// Mock the theme store
jest.mock('@/shared/store', () => ({
  useTheme: () => ({
    colors: {
      background: '#EBE5D9',
      text: '#070707',
      primary: '#264854',
      secondary: '#AD915A',
    },
    isDark: false,
    toggleTheme: jest.fn(),
  }),
}));

describe('MediaPlayerAdvancedPanel', () => {
  it('renders the advanced panel with placeholder text', () => {
    const { getByTestId, getByText } = render(
      <MediaPlayerAdvancedPanel testID='advanced-panel' />
    );

    expect(getByTestId('advanced-panel')).toBeTruthy();
    expect(getByText('Advanced Media Player Panel')).toBeTruthy();
    expect(getByText('(Future features will go here)')).toBeTruthy();
  });

  it('applies correct styling with theme colors', () => {
    const { getByTestId } = render(
      <MediaPlayerAdvancedPanel testID='advanced-panel' />
    );

    const container = getByTestId('advanced-panel');
    expect(container).toBeTruthy();
  });

  it('renders without testID when not provided', () => {
    const { getByText } = render(<MediaPlayerAdvancedPanel />);

    expect(getByText('Advanced Media Player Panel')).toBeTruthy();
  });
});
