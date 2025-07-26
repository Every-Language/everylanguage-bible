import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const ONBOARDING_STORAGE_KEY = '@bible_app_onboarding';

interface OnboardingContextType {
  showOnboarding: boolean | null;
  setShowOnboarding: (show: boolean) => void;
  resetOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const onboardingState = JSON.parse(stored);
        setShowOnboarding(!onboardingState.isCompleted);
      } else {
        setShowOnboarding(true);
      }
    } catch (error) {
      logger.error('Failed to check onboarding status:', error);
      setShowOnboarding(true);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setShowOnboarding(true);
    } catch (error) {
      logger.error('Failed to reset onboarding:', error);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({ isCompleted: true })
      );
      setShowOnboarding(false);
    } catch (error) {
      logger.error('Failed to save onboarding completion:', error);
      setShowOnboarding(false);
    }
  }, []);

  const value: OnboardingContextType = {
    showOnboarding,
    setShowOnboarding,
    resetOnboarding,
    checkOnboardingStatus,
    completeOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
