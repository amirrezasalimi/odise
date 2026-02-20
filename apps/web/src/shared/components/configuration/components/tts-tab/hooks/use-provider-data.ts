import { useState } from "react";
import type { TTSProvider, TTSProviderVariant, TTSProviderSpeaker } from "@odise/types";
import { plugins_registry } from "@/shared/constants/plugins";

export const useProviderData = () => {
    const [variants, setVariants] = useState<Record<string, TTSProviderVariant[]>>({});
    const [speakers, setSpeakers] = useState<Record<string, TTSProviderSpeaker[]>>({});
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

    const getOrCreatedInstance = (pluginId: string, apiConfig?: { apiKey: string, url: string }) => {
        const PluginClass = plugins_registry.find(p => {
            try {
                const temp = new p() as any;
                return temp.info?.type === "tts" && temp.info?.id === pluginId;
            } catch { return false; }
        });
        if (!PluginClass) return null;
        const instance = new PluginClass() as any;
        if (apiConfig && instance.setConfig) {
            instance.setConfig(apiConfig);
        }
        return instance as TTSProvider;
    };

    const loadVariants = async (id: string, pluginId: string, apiConfig?: { apiKey: string, url: string }) => {
        const instance = getOrCreatedInstance(pluginId, apiConfig);
        if (!instance || !instance.loadVariants) return;

        setIsLoading(prev => ({ ...prev, [`${id}_variants`]: true }));
        try {
            const v = await instance.loadVariants();
            setVariants(prev => ({ ...prev, [id]: v }));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(prev => ({ ...prev, [`${id}_variants`]: false }));
        }
    };

    const loadSpeakers = async (id: string, pluginId: string, instanceOrConfig: TTSProvider | { apiKey: string, url: string }) => {
        let instance: TTSProvider | null = null;
        if ((instanceOrConfig as any).getSpeakers) {
            instance = instanceOrConfig as TTSProvider;
        } else {
            instance = getOrCreatedInstance(pluginId, instanceOrConfig as { apiKey: string, url: string });
        }

        if (!instance || !instance.getSpeakers) return;

        setIsLoading(prev => ({ ...prev, [`${id}_speakers`]: true }));
        try {
            const s = await instance.getSpeakers();
            setSpeakers(prev => ({ ...prev, [id]: s }));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(prev => ({ ...prev, [`${id}_speakers`]: false }));
        }
    };

    return { variants, speakers, isLoading, loadVariants, loadSpeakers };
};
export type UseProviderDataReturn = ReturnType<typeof useProviderData>;
