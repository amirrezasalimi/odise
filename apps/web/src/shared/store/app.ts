import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { TTSProvider, EmbeddingProvider } from "@odise/types";

interface StateAndActions {
    localTTS: Record<string, TTSProvider>;
    setLocalTTS: (pluginId: string, instance: TTSProvider) => void;
    removeLocalTTS: (pluginId: string) => void;

    localEmbedding: Record<string, EmbeddingProvider>;
    setLocalEmbedding: (pluginId: string, instance: EmbeddingProvider) => void;
    removeLocalEmbedding: (pluginId: string) => void;
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

        localEmbedding: {},
        setLocalEmbedding: (pluginId, instance) =>
            set((state) => {
                state.localEmbedding[pluginId] = instance;
            }),
        removeLocalEmbedding: (pluginId) =>
            set((state) => {
                delete state.localEmbedding[pluginId];
            }),
    })),
);

export default useAppStore;
