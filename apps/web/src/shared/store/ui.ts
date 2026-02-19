import { create } from "zustand";

interface UIState {
    isConfigModalOpen: boolean;
    toggleConfigModal: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isConfigModalOpen: false,
    toggleConfigModal: (open) => set({ isConfigModalOpen: open }),
}));
