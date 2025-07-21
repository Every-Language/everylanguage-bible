export interface OnboardingSlideState {
  isCompleted: boolean;
  selectedLanguage?: string;
  importedBibles?: string[];
}

export interface OnboardingSlideContextType {
  state: OnboardingSlideState;
  completeOnboarding: () => void;
  setSelectedLanguage: (language: string) => void;
  setImportedBibles: (bibles: string[]) => void;
  resetOnboarding: () => void;
}
