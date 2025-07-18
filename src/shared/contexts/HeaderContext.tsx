import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

export type ScreenType = 'bible-books' | 'other';

export interface ButtonStates {
  bibleVisible?: boolean;
  playlistsVisible?: boolean;
  searchVisible?: boolean;
  optionsVisible?: boolean;
}

export interface HeaderContextType {
  // Current screen information
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;

  // Bottom content (toggle buttons, search bar, etc.)
  bottomContent: ReactNode;
  setBottomContent: (content: ReactNode) => void;

  // Button handlers - passed down from the wrapper to screens
  onTitlePress?: (() => void) | undefined;
  onBiblePress?: (() => void) | undefined;
  onPlaylistsPress?: (() => void) | undefined;
  onOptionsPress?: (() => void) | undefined;

  // Button appearance/visibility based on screen
  buttonStates?: ButtonStates;
  setButtonStates?: (states: ButtonStates) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export interface HeaderProviderProps {
  children: ReactNode;
  onTitlePress?: (() => void) | undefined;
  onBiblePress?: (() => void) | undefined;
  onPlaylistsPress?: (() => void) | undefined;
  onOptionsPress?: (() => void) | undefined;
}

export const HeaderProvider: React.FC<HeaderProviderProps> = ({
  children,
  onTitlePress,
  onBiblePress,
  onPlaylistsPress,
  onOptionsPress,
}) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('bible-books');
  const [bottomContent, setBottomContent] = useState<ReactNode>(null);
  const [buttonStates, setButtonStates] = useState<ButtonStates>({
    bibleVisible: true,
    playlistsVisible: true,
    searchVisible: true,
    optionsVisible: true,
  });

  const setButtonStatesCallback = useCallback((states: ButtonStates) => {
    setButtonStates(states);
  }, []);

  const value: HeaderContextType = useMemo(
    () => ({
      currentScreen,
      setCurrentScreen,
      bottomContent,
      setBottomContent,
      onTitlePress,
      onBiblePress,
      onPlaylistsPress,
      onOptionsPress,
      buttonStates,
      setButtonStates: setButtonStatesCallback,
    }),
    [
      currentScreen,
      setCurrentScreen,
      bottomContent,
      setBottomContent,
      onTitlePress,
      onBiblePress,
      onPlaylistsPress,
      onOptionsPress,
      buttonStates,
      setButtonStatesCallback,
    ]
  );

  return (
    <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
  );
};

export const useHeader = (): HeaderContextType => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};
