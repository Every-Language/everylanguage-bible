import Slides from '@/features/onboarding/screens/slides';
import { create } from 'zustand';

interface MyOnBoardingStoreState {
  screenNumber: number;
  incrementScreenNumber: () => void;
  decrementScreenNumber: () => void;
  resetScreenNumber: () => void;
  setScreenNumber: (screenNumber: number) => void;
}

export const useOnBoardingStore = create<MyOnBoardingStoreState>()(set => ({
  screenNumber: 0,

  incrementScreenNumber: () => {
    set(state => {
      if (state.screenNumber < Slides.length - 1) {
        return {
          screenNumber: state.screenNumber + 1,
        };
      }
      return {
        screenNumber: state.screenNumber,
      };
    });
  },
  decrementScreenNumber: () =>
    set(state => {
      if (state.screenNumber > 0) {
        return {
          screenNumber: state.screenNumber - 1,
        };
      }
      return {
        screenNumber: state.screenNumber,
      };
    }),
  resetScreenNumber: () => set(() => ({ screenNumber: 1 })),
  setScreenNumber: screenNumber => set(() => ({ screenNumber: screenNumber })),
}));
