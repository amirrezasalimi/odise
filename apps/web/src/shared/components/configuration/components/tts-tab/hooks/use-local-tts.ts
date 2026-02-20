import useAppStore from "@/shared/store/app";
import { plugins_registry } from "@/shared/constants/plugins";
import { useState } from "react";
import type { TTSProvider } from "@odise/types";

export const useLocalTTS = () => {
    const { localTTS, setLocalTTS, removeLocalTTS } = useAppStore();
    const [loadingProgress, setLoadingProgress] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

    const loadLocal = async (pluginId: string, variantId?: string) => {
        // If already loaded, we might want to reload if variant changed, but for now just skip or unload first
        if (localTTS[pluginId]) {
            await unloadLocal(pluginId);
        }

        const PluginClass = plugins_registry.find(p => {
            try {
                const temp = new p() as any;
                return temp.info?.type === "tts" && temp.info?.id === pluginId && temp.options?.isLocal;
            } catch { return false; }
        });

        if (!PluginClass) return;

        setIsLoading(prev => ({ ...prev, [pluginId]: true }));
        setLoadingProgress(prev => ({ ...prev, [pluginId]: 0 }));

        try {
            const instance = new PluginClass() as TTSProvider;
            if (instance.load) {
                await instance.load(variantId, (progress) => {
                    setLoadingProgress(prev => ({ ...prev, [pluginId]: progress }));
                });
            }
            instance.selectedVariantId = variantId;
            setLocalTTS(pluginId, instance);

        } catch (error) {
            console.error(`Failed to load local TTS ${pluginId}:`, error);
        } finally {
            setIsLoading(prev => ({ ...prev, [pluginId]: false }));
            setLoadingProgress(prev => ({ ...prev, [pluginId]: 100 }));
        }
    };

    const unloadLocal = async (pluginId: string) => {
        const instance = localTTS[pluginId];
        if (!instance) return;

        try {
            if (instance.unload) {
                await instance.unload();
            }
        } catch (error) {
            console.error(`Failed to unload local TTS ${pluginId}:`, error);
        } finally {
            removeLocalTTS(pluginId);
            setLoadingProgress(prev => {
                const next = { ...prev };
                delete next[pluginId];
                return next;
            });
        }
    };

    return {
        localTTS,
        isLoading,
        loadingProgress,
        loadLocal,
        unloadLocal
    };
};
