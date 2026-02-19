import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { CONFIG_KEYS } from "../constants/config";

const usePlugins = () => {
    const [isLoadingPlugins] = useState(false);

    // Get TTS provider configs from Convex
    const ttsConfigQuery = useQuery(api.apis.config.getConfig, {
        key: CONFIG_KEYS.api_tts_providers
    });
    const llmConfigQuery = useQuery(api.apis.config.getConfig, {
        key: CONFIG_KEYS.api_llm_providers
    });

    const configsLoading = typeof ttsConfigQuery == "undefined" || typeof llmConfigQuery == "undefined";

    const load = () => {
        // No-op for now as we load on demand in the config tab
    };

    return {
        isLoadingPlugins,
        load,
        configsLoading
    }
}

export default usePlugins
