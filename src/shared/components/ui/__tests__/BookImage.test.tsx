import React from 'react';
import { render } from '@testing-library/react-native';
import { Image } from 'react-native';
import { BookImage } from '../BookImage';
import { TamaguiTestWrapper } from '@/shared/test-utils/tamagui-test-setup';

// Mock the theme store
const mockUseTheme = {
  colors: {
    background: '#EBE5D9',
    text: '#070707',
    primary: '#264854',
    secondary: '#AD915A',
  },
};

jest.mock('@/shared/store', () => ({
  useTheme: () => mockUseTheme,
}));

// Mock the getBookImageSource service
const mockGetBookImageSource = jest.fn();
jest.mock('@/shared/services', () => ({
  getBookImageSource: (imagePath: string | undefined) =>
    mockGetBookImageSource(imagePath),
}));

describe('BookImage', () => {
  beforeEach(() => {
    mockGetBookImageSource.mockClear();
  });

  const renderWithTamagui = (component: React.ReactElement) => {
    return render(<TamaguiTestWrapper>{component}</TamaguiTestWrapper>);
  };

  it('renders image when imagePath is provided and source exists', () => {
    const mockImageSource = { uri: 'test-image-source' };
    mockGetBookImageSource.mockReturnValue(mockImageSource);

    const { UNSAFE_getByType } = renderWithTamagui(
      <BookImage imagePath='01_genesis.png' />
    );

    expect(mockGetBookImageSource).toHaveBeenCalledWith('01_genesis.png');
    expect(UNSAFE_getByType(Image)).toBeTruthy();
  });

  it('renders fallback emoji when imagePath is not provided', () => {
    const { getByTestId, getByText } = renderWithTamagui(<BookImage />);

    expect(getByTestId('book-image-fallback')).toBeTruthy();
    expect(getByText('📖')).toBeTruthy();
    // Should not call getBookImageSource when no imagePath is provided
    expect(mockGetBookImageSource).not.toHaveBeenCalled();
  });

  it('renders fallback emoji when imagePath is provided but source does not exist', () => {
    mockGetBookImageSource.mockReturnValue(undefined);

    const { getByTestId, getByText } = renderWithTamagui(
      <BookImage imagePath='nonexistent.png' />
    );

    expect(mockGetBookImageSource).toHaveBeenCalledWith('nonexistent.png');
    expect(getByTestId('book-image-fallback')).toBeTruthy();
    expect(getByText('📖')).toBeTruthy();
  });

  it('uses custom fallback emoji when provided', () => {
    const { getByText } = renderWithTamagui(<BookImage fallbackEmoji='🌟' />);

    expect(getByText('🌟')).toBeTruthy();
    // Should not call getBookImageSource when no imagePath is provided
    expect(mockGetBookImageSource).not.toHaveBeenCalled();
  });

  it('applies custom size to image', () => {
    const mockImageSource = { uri: 'test-image-source' };
    mockGetBookImageSource.mockReturnValue(mockImageSource);

    const { UNSAFE_getByType } = renderWithTamagui(
      <BookImage imagePath='01_genesis.png' size={80} />
    );

    const image = UNSAFE_getByType(Image);
    expect(image.props.style[0].width).toBe(80);
    expect(image.props.style[0].height).toBe(80);
  });

  it('applies custom size to fallback container', () => {
    const { getByTestId } = renderWithTamagui(<BookImage size={100} />);

    const fallbackContainer = getByTestId('book-image-fallback');
    expect(fallbackContainer.props.style[0].width).toBe(100);
    expect(fallbackContainer.props.style[0].height).toBe(100);
    // Should not call getBookImageSource when no imagePath is provided
    expect(mockGetBookImageSource).not.toHaveBeenCalled();
  });

  it('scales emoji size based on container size', () => {
    const { getByTestId } = renderWithTamagui(<BookImage size={80} />);

    const emoji = getByTestId('book-image-emoji');
    expect(emoji.props.style.fontSize).toBe(40); // 80 * 0.5
    // Should not call getBookImageSource when no imagePath is provided
    expect(mockGetBookImageSource).not.toHaveBeenCalled();
  });

  it('applies custom styles to image', () => {
    const mockImageSource = { uri: 'test-image-source' };
    mockGetBookImageSource.mockReturnValue(mockImageSource);
    const customStyle = { opacity: 0.8 };

    const { UNSAFE_getByType } = renderWithTamagui(
      <BookImage imagePath='01_genesis.png' style={customStyle} />
    );

    const image = UNSAFE_getByType(Image);
    expect(image.props.style[1]).toEqual(customStyle);
  });

  it('applies custom styles to fallback container', () => {
    const customStyle = { opacity: 0.8 };

    const { getByTestId } = renderWithTamagui(
      <BookImage style={customStyle} />
    );

    const fallbackContainer = getByTestId('book-image-fallback');
    expect(fallbackContainer.props.style[1]).toEqual(customStyle);
    // Should not call getBookImageSource when no imagePath is provided
    expect(mockGetBookImageSource).not.toHaveBeenCalled();
  });

  it('uses custom testID when provided', () => {
    const mockImageSource = { uri: 'test-image-source' };
    mockGetBookImageSource.mockReturnValue(mockImageSource);

    const { getByTestId } = renderWithTamagui(
      <BookImage imagePath='01_genesis.png' testID='custom-book-image' />
    );

    expect(getByTestId('custom-book-image')).toBeTruthy();
  });

  it('uses custom testID for fallback when provided', () => {
    const { getByTestId } = renderWithTamagui(
      <BookImage testID='custom-fallback' />
    );

    expect(getByTestId('custom-fallback')).toBeTruthy();
    // Should not call getBookImageSource when no imagePath is provided
    expect(mockGetBookImageSource).not.toHaveBeenCalled();
  });

  it('applies theme colors to fallback container and text', () => {
    const { getByTestId } = renderWithTamagui(<BookImage />);

    const fallbackContainer = getByTestId('book-image-fallback');
    const emoji = getByTestId('book-image-emoji');

    expect(fallbackContainer.props.style[0].backgroundColor).toBe('#AD915A30');
    expect(emoji.props.style.color).toBe('#070707');
    // Should not call getBookImageSource when no imagePath is provided
    expect(mockGetBookImageSource).not.toHaveBeenCalled();
  });

  it('sets correct resizeMode for images', () => {
    const mockImageSource = { uri: 'test-image-source' };
    mockGetBookImageSource.mockReturnValue(mockImageSource);

    const { UNSAFE_getByType } = renderWithTamagui(
      <BookImage imagePath='01_genesis.png' />
    );

    const image = UNSAFE_getByType(Image);
    expect(image.props.resizeMode).toBe('contain');
  });
});
