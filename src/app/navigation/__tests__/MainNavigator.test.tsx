import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { MainNavigator } from '../MainNavigator';

const NavigationWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <NavigationContainer>{children}</NavigationContainer>;

describe('MainNavigator', () => {
  it('renders tab navigation correctly', () => {
    const { getByText } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    expect(getByText('Bible')).toBeTruthy();
    expect(getByText('Bookmarks')).toBeTruthy();
  });

  it('shows mini player when a book is selected', async () => {
    const { getByTestId, queryByTestId } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    // Initially, mini player should not be visible
    expect(queryByTestId('main-mini-player')).toBeNull();

    // Wait for the books to load and select Genesis
    await waitFor(() => {
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    // Mini player should now be visible
    await waitFor(() => {
      expect(queryByTestId('main-mini-player')).toBeTruthy();
    });
  });

  it('navigates to bookmarks tab', () => {
    const { getByText } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    fireEvent.press(getByText('Bookmarks'));
    expect(getByText('Coming soon!')).toBeTruthy();
  });

  it('handles mini player controls', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const { getByTestId } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    // Select a book first
    await waitFor(() => {
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    // Test play/pause functionality
    await waitFor(() => {
      const playButton = getByTestId('mini-player-play-pause');
      fireEvent.press(playButton);
    });

    // Test previous button
    await waitFor(() => {
      const previousButton = getByTestId('mini-player-previous');
      fireEvent.press(previousButton);
    });

    // Test next button
    await waitFor(() => {
      const nextButton = getByTestId('mini-player-next');
      fireEvent.press(nextButton);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Selected book:', 'Genesis');
    expect(consoleSpy).toHaveBeenCalledWith('Previous verse');
    expect(consoleSpy).toHaveBeenCalledWith('Next verse');

    consoleSpy.mockRestore();
  });
});
