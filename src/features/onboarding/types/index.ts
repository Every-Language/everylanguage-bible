export interface OnboardingStepData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  image?: string;
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
  error?: string;
}

export interface OnboardingContextType {
  state: OnboardingState;
  nextStep: () => void;
  previousStep: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  goToStep: (stepIndex: number) => void;
}
