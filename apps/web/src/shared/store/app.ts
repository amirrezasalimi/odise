import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { TTSProvider } from "@odise/types";

interface StateAndActions {
    localTTS: Record<string, TTSProvider>;
    setLocalTTS: (pluginId: string, instance: TTSProvider) => void;
    removeLocalTTS: (pluginId: string) => void;
}

const useAppStore = create<StateAndActions>()(
    immer((set) => ({
        localTTS: {},
        setLocalTTS: (pluginId, instance) =>
            set((state) => {
                state.localTTS[pluginId] = instance;
            }),
        removeLocalTTS: (pluginId) =>
            set((state) => {
                delete state.localTTS[pluginId];
            }),
    })),
);

export default useAppStore;
