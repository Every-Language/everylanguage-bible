import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_STORAGE_KEY = '@bible_app_onboarding';

interface OnboardingSlideState {
  isCompleted: boolean;
  selectedLanguage?: string;
  importedBibles?: string[];
}

export const useOnboardingSlides = () => {
  const [state, setState] = useState<OnboardingSlideState>({
    isCompleted: false,
  });

  const saveOnboardingState = useCallback(
    async (newState: OnboardingSlideState) => {
      try {
        await AsyncStorage.setItem(
          ONBOARDING_STORAGE_KEY,
          JSON.stringify(newState)
        );
      } catch (error) {
        console.error('Failed to save onboarding state:', error);
      }
    },
    []
  );

  const completeOnboarding = useCallback(() => {
    const newState = {
      ...state,
      isCompleted: true,
    };
    setState(newState);
    saveOnboardingState(newState);
  }, [state, saveOnboardingState]);

  const setSelectedLanguage = useCallback(
    (language: string) => {
      const newState = {
        ...state,
        selectedLanguage: language,
      };
      setState(newState);
      saveOnboardingState(newState);
    },
    [state, saveOnboardingState]
  );

  const setImportedBibles = useCallback(
    (bibles: string[]) => {
      const newState = {
        ...state,
        importedBibles: bibles,
      };
      setState(newState);
      saveOnboardingState(newState);
    },
    [state, saveOnboardingState]
  );

  const resetOnboarding = useCallback(() => {
    const newState = {
      isCompleted: false,
    };
    setState(newState);
    saveOnboardingState(newState);
  }, [saveOnboardingState]);

  return {
    state,
    completeOnboarding,
    setSelectedLanguage,
    setImportedBibles,
    resetOnboarding,
  };
};
