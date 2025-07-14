import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CalculatorState {
  // Current state
  isCalculatorMode: boolean;
  userCode: string | null;

  // Actions
  enterCalculatorMode: (code: string) => void;
  exitCalculatorMode: (code: string) => boolean;
  clearCalculatorMode: () => void;
  isValidCode: (code: string) => boolean;
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      // Initial state
      isCalculatorMode: false,
      userCode: null,

      // Enter calculator mode with the user's code
      enterCalculatorMode: (code: string) => {
        set({
          isCalculatorMode: true,
          userCode: code,
        });
      },

      // Exit calculator mode if the provided code matches the stored code
      exitCalculatorMode: (code: string) => {
        const { userCode } = get();
        if (userCode === code) {
          set({
            isCalculatorMode: false,
            userCode: null,
          });
          return true;
        }
        return false;
      },

      // Clear calculator mode (for development/debugging)
      clearCalculatorMode: () => {
        set({
          isCalculatorMode: false,
          userCode: null,
        });
      },

      // Check if provided code matches the stored code
      isValidCode: (code: string) => {
        const { userCode } = get();
        return userCode === code;
      },
    }),
    {
      name: 'calculator-storage', // unique name for localStorage
      partialize: state => ({
        isCalculatorMode: state.isCalculatorMode,
        userCode: state.userCode,
      }),
    }
  )
);

// Hook for easier access to calculator mode state
export const useCalculatorMode = () => {
  const {
    isCalculatorMode,
    userCode,
    enterCalculatorMode,
    exitCalculatorMode,
    clearCalculatorMode,
    isValidCode,
  } = useCalculatorStore();

  return {
    isCalculatorMode,
    userCode,
    enterCalculatorMode,
    exitCalculatorMode,
    clearCalculatorMode,
    isValidCode,
  };
};
