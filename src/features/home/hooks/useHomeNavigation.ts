import { useState, useCallback } from 'react';
import { HomeTab } from '../types';

export const useHomeNavigation = (initialTab: HomeTab = 'Bible') => {
  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab);

  const switchTab = useCallback((tab: HomeTab) => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    switchTab,
  };
};
