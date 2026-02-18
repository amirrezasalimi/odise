import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { LoadedPlugins } from "@odise/plugins";
import type { TTSProviderVariant, TTSProviderSpeaker } from "@odise/types";

export interface TTSPluginState {
    isLoading: boolean;
    loadingProgress: number;
    isLoaded: boolean;
    variants: TTSProviderVariant[];
    selectedVariant: string | undefined;
    speakers: TTSProviderSpeaker[];
}

interface StateAndActions {
    isConfigModalOpen: boolean;
    toggleConfigModal: (open: boolean) => void;
    plugins: LoadedPlugins
    loadPlugins: (data: LoadedPlugins) => void

    // tts
    ttsPluginStates: Record<string, TTSPluginState>
    updateTTSPluginState: (pluginId: string, updates: Partial<TTSPluginState>) => void
    getTTSPluginState: (pluginId: string) => TTSPluginState
}

const useAppStore = create<StateAndActions>()(
    immer((set, get) => ({
        plugins: {
            tts: []
        },
        ttsPluginStates: {},
        isConfigModalOpen: false,
        toggleConfigModal: (open) =>
            set((state) => {
                state.isConfigModalOpen = open;
            }),
        loadPlugins: (data: LoadedPlugins) =>
            set((state) => {
                state.plugins = data;
            }),
        updateTTSPluginState: (pluginId: string, updates: Partial<TTSPluginState>) =>
            set((state) => {
                const currentState = state.ttsPluginStates[pluginId];
                state.ttsPluginStates[pluginId] = currentState
                    ? { ...currentState, ...updates }
                    : {
                        isLoading: false,
                        loadingProgress: 0,
                        isLoaded: false,
                        variants: [],
                        selectedVariant: undefined,
                        speakers: [],
                        ...updates,
                    };
            }),
        getTTSPluginState: (pluginId: string) => {
            const state = get().ttsPluginStates[pluginId];
            if (state) return state;
            return {
                isLoading: false,
                loadingProgress: 0,
                isLoaded: false,
                variants: [],
                selectedVariant: undefined,
                speakers: [],
            };
        }
    })),

);

export default useAppStore;
