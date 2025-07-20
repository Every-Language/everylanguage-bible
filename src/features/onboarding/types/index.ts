export interface OnboardingStepData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  image?: string;
  isDatabaseStep?: boolean;
}

export interface OnboardingState {
  isCompleted: boolean;
  currentStep: number;
  steps: OnboardingStepData[];
}

export interface DatabaseProgress {
  stage:
    | 'opening'
    | 'migrating'
    | 'creating_tables'
    | 'verifying'
    | 'complete'
    | 'error';
  message: string;
  progress: number;
  error?: string | undefined;
}

export interface OnboardingContextType {
  state: OnboardingState;
  nextStep: () => void;
  previousStep: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  goToStep: (stepIndex: number) => void;
  loadOnboardingState: () => Promise<void>;
  databaseProgress: DatabaseProgress | null;
  isDatabaseInitializing: boolean;
  initializeDatabase: () => Promise<void>;
  retryDatabaseInitialization: () => Promise<void>;
}

export interface OnboardingStepProps {
  step: OnboardingStepData;
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
  isLastStep: boolean;
}

export interface DatabaseStepProps extends OnboardingStepProps {
  databaseProgress: DatabaseProgress | null;
  isDatabaseInitializing: boolean;
  onInitializeDatabase: () => Promise<void>;
  onRetryDatabase: () => Promise<void>;
}
