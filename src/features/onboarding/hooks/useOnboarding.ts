import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OnboardingState,
  OnboardingStepData,
  DatabaseProgress,
} from '../types';
import DatabaseManager, {
  DatabaseInitProgress,
} from '@/shared/services/database/DatabaseManager';

const ONBOARDING_STORAGE_KEY = '@bible_app_onboarding';

const defaultSteps: OnboardingStepData[] = [
  {
    id: 'database-init',
    title: 'Database Initialization',
    subtitle: 'Setting up your Bible app',
    description:
      "We're preparing your Bible app with all the features you need to read, listen, and study scripture.",
    icon: '📖',
    isDatabaseStep: true,
  },
  {
    id: 'database-tables',
    title: 'Local Database',
    subtitle: 'Bible content stored on your device',
    description:
      'Your Bible app stores content locally so you can read and study even without an internet connection.',
    icon: '🗄️',
    isDatabaseStep: true,
  },
  {
    id: 'read',
    title: 'Read Scripture',
    subtitle: 'Multiple Translations Available',
    description:
      'Access the Bible in your preferred translation with easy navigation through books, chapters, and verses.',
    icon: '📚',
  },
  {
    id: 'listen',
    title: 'Listen to Audio',
    subtitle: 'Audio Bible Versions',
    description:
      'Listen to scripture being read aloud in multiple languages and versions for a different way to experience the Word.',
    icon: '🎧',
  },
  {
    id: 'study',
    title: 'Study Tools',
    subtitle: 'Deepen Your Understanding',
    description:
      'Use our study tools to bookmark verses, create playlists, and organize your spiritual journey.',
    icon: '🔍',
  },
  {
    id: 'sync',
    title: 'Stay Connected',
    subtitle: 'Sync Across Devices',
    description:
      'Your progress, bookmarks, and preferences sync seamlessly across all your devices.',
    icon: '☁️',
  },
];

const initialState: OnboardingState = {
  isCompleted: false,
  currentStep: 0,
  steps: defaultSteps,
};

export const useOnboarding = () => {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [databaseProgress, setDatabaseProgress] =
    useState<DatabaseProgress | null>(null);
  const [isDatabaseInitializing, setIsDatabaseInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state on mount
  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        setState(parsedState);
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
      // Keep default state if loading fails
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveOnboardingState = useCallback(async (newState: OnboardingState) => {
    try {
      await AsyncStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify(newState)
      );
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  }, []);

  const nextStep = useCallback(() => {
    setState(prevState => {
      const newState = {
        ...prevState,
        currentStep: Math.min(
          prevState.currentStep + 1,
          prevState.steps.length - 1
        ),
      };
      saveOnboardingState(newState);
      return newState;
    });
  }, [saveOnboardingState]);

  const previousStep = useCallback(() => {
    setState(prevState => {
      const newState = {
        ...prevState,
        currentStep: Math.max(prevState.currentStep - 1, 0),
      };
      saveOnboardingState(newState);
      return newState;
    });
  }, [saveOnboardingState]);

  const goToStep = useCallback(
    (stepIndex: number) => {
      setState(prevState => {
        const newState = {
          ...prevState,
          currentStep: Math.max(
            0,
            Math.min(stepIndex, prevState.steps.length - 1)
          ),
        };
        saveOnboardingState(newState);
        return newState;
      });
    },
    [saveOnboardingState]
  );

  const completeOnboarding = useCallback(() => {
    setState(prevState => {
      const newState = {
        ...prevState,
        isCompleted: true,
        currentStep: 0,
      };
      saveOnboardingState(newState);
      return newState;
    });
  }, [saveOnboardingState]);

  const resetOnboarding = useCallback(() => {
    setState(initialState);
    setDatabaseProgress(null);
    setIsDatabaseInitializing(false);
    saveOnboardingState(initialState);
  }, [saveOnboardingState]);

  const initializeDatabase = useCallback(async () => {
    if (isDatabaseInitializing) return;

    setIsDatabaseInitializing(true);
    setDatabaseProgress({
      stage: 'opening',
      message: 'Initializing database...',
      progress: 0,
    } as DatabaseProgress);

    const databaseManager = DatabaseManager.getInstance();

    try {
      databaseManager.setProgressCallback((progress: DatabaseInitProgress) => {
        setDatabaseProgress({
          stage: progress.stage,
          message: progress.message,
          progress: progress.progress,
          error: progress.error,
        });
      });

      console.log('useOnboarding: Database initialization started');
      await databaseManager.initialize();
      console.log('useOnboarding: Database initialization completed');

      // Small delay to show completion
      setTimeout(() => {
        setDatabaseProgress({
          stage: 'complete',
          message: 'Database ready!',
          progress: 100,
        });
      }, 500);
    } catch (error) {
      console.error('Database initialization failed:', error);
      setDatabaseProgress({
        stage: 'error',
        message: 'Database initialization failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsDatabaseInitializing(false);
    }
  }, [isDatabaseInitializing]);

  const retryDatabaseInitialization = useCallback(async () => {
    setDatabaseProgress(null);
    await initializeDatabase();
  }, [initializeDatabase]);

  return {
    state,
    isLoading,
    nextStep,
    previousStep,
    completeOnboarding,
    resetOnboarding,
    goToStep,
    loadOnboardingState,
    databaseProgress,
    isDatabaseInitializing,
    initializeDatabase,
    retryDatabaseInitialization,
  };
};
