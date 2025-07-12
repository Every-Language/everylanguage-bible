import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { SlideUpPanel } from '../SlideUpPanel';
import { TamaguiTestWrapper } from '@/shared/test-utils/tamagui-test-setup';

// Mock the theme store
const mockUseTheme = {
  colors: {
    background: '#EBE5D9',
    text: '#070707',
    primary: '#264854',
    secondary: '#AD915A',
  },
  isDark: false,
};

jest.mock('@/shared/store', () => ({
  useTheme: () => mockUseTheme,
}));

describe('SlideUpPanel', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  const renderWithTamagui = (component: React.ReactElement) => {
    return render(<TamaguiTestWrapper>{component}</TamaguiTestWrapper>);
  };

  it('renders when visible', () => {
    const { getByTestId } = renderWithTamagui(
      <SlideUpPanel isVisible={true} onClose={mockOnClose} testID='test-panel'>
        <View>
          <Text>Test Content</Text>
        </View>
      </SlideUpPanel>
    );

    expect(getByTestId('test-panel')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = renderWithTamagui(
      <SlideUpPanel isVisible={false} onClose={mockOnClose} testID='test-panel'>
        <View>
          <Text>Test Content</Text>
        </View>
      </SlideUpPanel>
    );

    expect(queryByTestId('test-panel')).toBeNull();
  });

  it('renders with title when provided', () => {
    const { getByText } = renderWithTamagui(
      <SlideUpPanel
        isVisible={true}
        onClose={mockOnClose}
        title='Test Title'
        testID='test-panel'>
        <View>
          <Text>Test Content</Text>
        </View>
      </SlideUpPanel>
    );

    expect(getByText('Test Title')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = renderWithTamagui(
      <SlideUpPanel isVisible={true} onClose={mockOnClose} testID='test-panel'>
        <View>
          <Text>Test Content</Text>
        </View>
      </SlideUpPanel>
    );

    const closeButton = getByTestId('test-panel-close-button');
    fireEvent.press(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is pressed', () => {
    const { getByTestId } = renderWithTamagui(
      <SlideUpPanel isVisible={true} onClose={mockOnClose} testID='test-panel'>
        <View>
          <Text>Test Content</Text>
        </View>
      </SlideUpPanel>
    );

    const backdrop = getByTestId('test-panel-backdrop');
    fireEvent.press(backdrop);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when drag bar is pressed', () => {
    const { getByTestId } = renderWithTamagui(
      <SlideUpPanel isVisible={true} onClose={mockOnClose} testID='test-panel'>
        <View>
          <Text>Test Content</Text>
        </View>
      </SlideUpPanel>
    );

    const dragBar = getByTestId('test-panel-drag-bar');
    fireEvent.press(dragBar);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('hides drag bar when showDragBar is false', () => {
    const { queryByTestId } = renderWithTamagui(
      <SlideUpPanel
        isVisible={true}
        onClose={mockOnClose}
        showDragBar={false}
        testID='test-panel'>
        <View>
          <Text>Test Content</Text>
        </View>
      </SlideUpPanel>
    );

    expect(queryByTestId('test-panel-drag-bar')).toBeNull();
  });

  it('hides close button when showCloseButton is false', () => {
    const { queryByTestId } = renderWithTamagui(
      <SlideUpPanel
        isVisible={true}
        onClose={mockOnClose}
        showCloseButton={false}
        testID='test-panel'>
        <View>
          <Text>Test Content</Text>
        </View>
      </SlideUpPanel>
    );

    expect(queryByTestId('test-panel-close-button')).toBeNull();
  });

  it('hides backdrop when backdrop is false', () => {
    const { queryByTestId } = renderWithTamagui(
      <SlideUpPanel
        isVisible={true}
        onClose={mockOnClose}
        backdrop={false}
        testID='test-panel'>
        <View>
          <Text>Test Content</Text>
        </View>
      </SlideUpPanel>
    );

    expect(queryByTestId('test-panel-backdrop')).toBeNull();
  });
});
