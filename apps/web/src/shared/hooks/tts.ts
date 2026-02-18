import useAppStore from "../store/app";
import { plugins_registry } from "../constants/plugins";
import type { TTSProviderVariant, TTSProviderSpeaker } from "@odise/types";
import type { TTSPluginState } from "../store/app";

const useTTS = () => {
    const { ttsPluginStates, updateTTSPluginState, getTTSPluginState, plugins } = useAppStore();

    const getPluginState = (pluginId: string) => getTTSPluginState(pluginId);

    const updatePluginState = (pluginId: string, updates: Partial<TTSPluginState>) => updateTTSPluginState(pluginId, updates);

    const loadPlugin = async (pluginId: string, variantId?: string) => {
        const plugin = plugins.tts.find(p => p.info?.id === pluginId);
        if (!plugin) return;

        updatePluginState(pluginId, { isLoading: true, loadingProgress: 0 });

        try {
            if (plugin.options?.hasVariants && plugin.loadVariants) {
                const variants = await plugin.loadVariants();
                updatePluginState(pluginId, { variants });
            }

            if (plugin.load) {
                await plugin.load(variantId, (progress) => updatePluginState(pluginId, { loadingProgress: progress }));
            }

            if (plugin.getSpeakers) {
                const speakers = await plugin.getSpeakers();
                updatePluginState(pluginId, { speakers });
            }

            updatePluginState(pluginId, {
                isLoading: false,
                isLoaded: true,
                selectedVariant: variantId,
                loadingProgress: 100,
            });
        } catch (error) {
            console.error(`Failed to load TTS plugin ${pluginId}:`, error);
            updatePluginState(pluginId, { isLoading: false });
        }
    };

    const unloadPlugin = async (pluginId: string) => {
        const plugin = plugins.tts.find(p => p.info?.id === pluginId);
        if (!plugin) return;

        try {
            if (plugin.unload) {
                await plugin.unload();
            }
            updatePluginState(pluginId, {
                isLoaded: false,
                isLoading: false,
                loadingProgress: 0,
                selectedVariant: undefined,
                speakers: [],
            });
        } catch (error) {
            console.error(`Failed to unload TTS plugin ${pluginId}:`, error);
        }
    };

    const loadVariants = async (pluginId: string): Promise<TTSProviderVariant[]> => {
        const plugin = plugins.tts.find(p => p.info?.id === pluginId);
        if (!plugin || !plugin.loadVariants) return [];

        try {
            const variants = await plugin.loadVariants();
            updatePluginState(pluginId, { variants });
            return variants;
        } catch (error) {
            console.error(`Failed to load variants for TTS plugin ${pluginId}:`, error);
            return [];
        }
    };

    const getSpeakers = async (pluginId: string): Promise<TTSProviderSpeaker[]> => {
        const plugin = plugins.tts.find(p => p.info?.id === pluginId);
        if (!plugin || !plugin.getSpeakers) return [];

        try {
            const speakers = await plugin.getSpeakers();
            updatePluginState(pluginId, { speakers });
            return speakers;
        } catch (error) {
            console.error(`Failed to get speakers for TTS plugin ${pluginId}:`, error);
            return [];
        }
    };

    const configureNonLocalProvider = (pluginId: string, config: { apiKey: string; url: string }) => {
        const PluginClass = plugins_registry.find((p) => {
            const temp = new p();
            return (temp as any).info?.id === pluginId;
        });

        if (!PluginClass) return null;

        const instance = new PluginClass() as any;
        if (instance.setConfig) {
            instance.setConfig(config);
        }
        return instance;
    };

    return {
        plugins: plugins.tts,
        pluginStates: ttsPluginStates,
        loadPlugin,
        unloadPlugin,
        loadVariants,
        getSpeakers,
        getPluginState,
        updatePluginState,
        configureNonLocalProvider,
    }
}

export default useTTS
