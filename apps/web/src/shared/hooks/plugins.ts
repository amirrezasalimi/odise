import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { CONFIG_KEYS } from "../constants/config";
import useAppStore from "../store/app";
import { plugins_registry } from "../constants/plugins";
import { transformNonLocalConfigsToInstances } from "../utils/plugin-transformer";
import type { ApiTTSProvidersConfig } from "../types/config";
import type { TTSProvider } from "@odise/types";

const usePlugins = () => {
    const { loadPlugins } = useAppStore();
    const [isLoadingPlugins, setIsLoadingPlugins] = useState(false);

    // Get TTS provider configs from Convex
    const ttsConfigQuery = useQuery(api.apis.config.getConfig, {
        key: CONFIG_KEYS.api_tts_providers
    });
    const llmConfigQuery = useQuery(api.apis.config.getConfig, {
        key: CONFIG_KEYS.api_llm_providers
    });

    const configsLoading = typeof ttsConfigQuery == "undefined" || typeof llmConfigQuery == "undefined";

    const load = () => {
        if (configsLoading) return;
        setIsLoadingPlugins(true);

        // tts
        const localTTSPlugins = plugins_registry
            .map((PluginClass) => new PluginClass() as TTSProvider)
            .filter((instance) => instance.options?.isLocal);

        let nonLocalTTSPlugins: TTSProvider[] = [];
        if (ttsConfigQuery) {
            try {
                const config = JSON.parse(ttsConfigQuery as string) as ApiTTSProvidersConfig;
                nonLocalTTSPlugins = transformNonLocalConfigsToInstances(plugins_registry, config.providers);
            } catch (error) {
                console.error("Failed to parse TTS providers config:", error);
            }
        }

        // 3. Store all plugins in appStore (not useRef)
        loadPlugins({ tts: [...localTTSPlugins, ...nonLocalTTSPlugins] });

        // 
        setIsLoadingPlugins(false);
    };

    return {
        isLoadingPlugins,
        load,
        configsLoading
    }
}

export default usePlugins
