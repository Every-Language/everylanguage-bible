import { useWindowDimensions } from 'react-native';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  // Breakpoints
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;

  // Responsive spacing
  const spacing = {
    xs: isSmallScreen ? 4 : isMediumScreen ? 6 : 8,
    sm: isSmallScreen ? 8 : isMediumScreen ? 12 : 16,
    md: isSmallScreen ? 12 : isMediumScreen ? 16 : 20,
    lg: isSmallScreen ? 16 : isMediumScreen ? 20 : 24,
    xl: isSmallScreen ? 20 : isMediumScreen ? 24 : 32,
    '2xl': isSmallScreen ? 24 : isMediumScreen ? 32 : 40,
  };

  // Responsive font sizes
  const fontSize = {
    xs: isSmallScreen ? 10 : isMediumScreen ? 12 : 14,
    sm: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
    md: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
    lg: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
    xl: isSmallScreen ? 18 : isMediumScreen ? 20 : 24,
    '2xl': isSmallScreen ? 20 : isMediumScreen ? 24 : 28,
    '3xl': isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
  };

  // Responsive component sizes
  const componentSize = {
    icon: isSmallScreen ? 60 : isMediumScreen ? 80 : 100,
    logo: isSmallScreen ? 80 : isMediumScreen ? 100 : 120,
    button: isSmallScreen ? 44 : isMediumScreen ? 48 : 56,
  };

  // Responsive padding
  const padding = {
    horizontal: isSmallScreen ? 20 : isMediumScreen ? 30 : 40,
    vertical: isSmallScreen ? 20 : isMediumScreen ? 30 : 40,
  };

  return {
    width,
    height,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    spacing,
    fontSize,
    componentSize,
    padding,
  };
};
