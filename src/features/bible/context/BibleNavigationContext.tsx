import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Book, BibleNavigationState } from '../types';

interface BibleNavigationContextType {
  navigationState: BibleNavigationState;
  navigateToBooks: () => void;
  navigateToChapters: (book: Book) => void;
}

const BibleNavigationContext = createContext<
  BibleNavigationContextType | undefined
>(undefined);

interface BibleNavigationProviderProps {
  children: ReactNode;
}

export const BibleNavigationProvider: React.FC<
  BibleNavigationProviderProps
> = ({ children }) => {
  const [navigationState, setNavigationState] = useState<BibleNavigationState>({
    currentScreen: 'books',
    selectedBook: null,
  });

  const navigateToBooks = () => {
    setNavigationState({
      currentScreen: 'books',
      selectedBook: null,
    });
  };

  const navigateToChapters = (book: Book) => {
    setNavigationState({
      currentScreen: 'chapters',
      selectedBook: book,
    });
  };

  const value: BibleNavigationContextType = {
    navigationState,
    navigateToBooks,
    navigateToChapters,
  };

  return (
    <BibleNavigationContext.Provider value={value}>
      {children}
    </BibleNavigationContext.Provider>
  );
};

export const useBibleNavigation = (): BibleNavigationContextType => {
  const context = useContext(BibleNavigationContext);
  if (!context) {
    throw new Error(
      'useBibleNavigation must be used within a BibleNavigationProvider'
    );
  }
  return context;
};
