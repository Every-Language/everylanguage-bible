import { create } from 'zustand';

interface HelpPanelState {
  isOpen: boolean;
  openHelpPanel: () => void;
  closeHelpPanel: () => void;
}

export const useHelpPanelStore = create<HelpPanelState>(set => ({
  isOpen: false,

  openHelpPanel: () => {
    set({ isOpen: true });
  },

  closeHelpPanel: () => {
    set({ isOpen: false });
  },
}));
