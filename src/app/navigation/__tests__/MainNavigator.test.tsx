import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { MainNavigator } from '../MainNavigator';

// Mock the utils used by BibleBooksScreen
jest.mock('@/shared/utils', () => ({
  loadBibleBooks: () => [
    {
      id: '01',
      name: 'Genesis',
      testament: 'old',
      chapters: 50,
      order: 1,
      imagePath: '01_genesis.png',
    },
    {
      id: '02',
      name: 'Exodus',
      testament: 'old',
      chapters: 40,
      order: 2,
      imagePath: '02_exodus.png',
    },
  ],
}));

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
    expect(getByText('Resources')).toBeTruthy();
  });

  it('shows mini player when a chapter is selected', async () => {
    const { getByTestId, queryByTestId } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    // Initially, mini player should not be visible
    expect(queryByTestId('main-mini-player')).toBeNull();

    // Wait for the books to load and expand Genesis
    await waitFor(() => {
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    // Select a chapter
    await waitFor(() => {
      const chapterTile = getByTestId('chapter-tile-1');
      fireEvent.press(chapterTile);
    });

    // Mini player should now be visible
    await waitFor(() => {
      expect(getByTestId('main-mini-player')).toBeTruthy();
    });
  });

  it('navigates to resources tab', () => {
    const { getByText } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    fireEvent.press(getByText('Resources'));
    expect(getByText('Coming soon!')).toBeTruthy();
  });

  it('handles mini player controls and displays correct chapter info', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const { getByTestId, getByText } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    // Expand Genesis first
    await waitFor(() => {
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    // Select chapter 5
    await waitFor(() => {
      const chapterTile = getByTestId('chapter-tile-5');
      fireEvent.press(chapterTile);
    });

    // Check that mini player shows correct info
    await waitFor(() => {
      const miniPlayer = getByTestId('main-mini-player');
      expect(miniPlayer).toBeTruthy();
      expect(getByText('Chapter 5')).toBeTruthy();
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

    expect(consoleSpy).toHaveBeenCalledWith('Selected chapter:', 'Genesis 5');
    expect(consoleSpy).toHaveBeenCalledWith('Previous verse');
    expect(consoleSpy).toHaveBeenCalledWith('Next verse');

    consoleSpy.mockRestore();
  });

  it('does not show mini player when only book is expanded', async () => {
    const { getByTestId, queryByTestId } = render(
      <NavigationWrapper>
        <MainNavigator />
      </NavigationWrapper>
    );

    // Wait for the books to load and expand Genesis
    await waitFor(() => {
      const genesisCard = getByTestId('book-card-01');
      fireEvent.press(genesisCard);
    });

    // Mini player should NOT be visible yet (only when chapter is selected)
    await waitFor(() => {
      expect(queryByTestId('main-mini-player')).toBeNull();
    });
  });
});
