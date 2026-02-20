import useAppStore from "@/shared/store/app";
import { plugins_registry } from "@/shared/constants/plugins";
import { useState } from "react";
import type { EmbeddingProvider } from "@odise/types";

export const useLocalEmbedding = () => {
    const { localEmbedding, setLocalEmbedding, removeLocalEmbedding } = useAppStore();
    const [loadingProgress, setLoadingProgress] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

    const loadLocal = async (pluginId: string, variantId?: string) => {
        if (localEmbedding[pluginId]) {
            await unloadLocal(pluginId);
        }

        const PluginClass = plugins_registry.find(p => {
            const temp = new p() as any;
            return temp.info?.id === pluginId && temp.options?.isLocal;
        });

        if (!PluginClass) return;

        setIsLoading(prev => ({ ...prev, [pluginId]: true }));
        setLoadingProgress(prev => ({ ...prev, [pluginId]: 0 }));

        try {
            const instance = new PluginClass() as EmbeddingProvider;
            if (instance.load) {
                // For embedding, maybe we don't have variants yet but following the pattern
                await instance.load((progress) => {
                    setLoadingProgress(prev => ({ ...prev, [pluginId]: progress }));
                });
            }
            setLocalEmbedding(pluginId, instance);
        } catch (error) {
            console.error(`Failed to load local embedding ${pluginId}:`, error);
        } finally {
            setIsLoading(prev => ({ ...prev, [pluginId]: false }));
            setLoadingProgress(prev => ({ ...prev, [pluginId]: 100 }));
        }
    };

    const unloadLocal = async (pluginId: string) => {
        const instance = localEmbedding[pluginId];
        if (!instance) return;

        try {
            if (instance.unload) {
                await instance.unload();
            }
        } catch (error) {
            console.error(`Failed to unload local embedding ${pluginId}:`, error);
        } finally {
            removeLocalEmbedding(pluginId);
            setLoadingProgress(prev => {
                const next = { ...prev };
                delete next[pluginId];
                return next;
            });
        }
    };

    return {
        localEmbedding,
        isLoading,
        loadingProgress,
        loadLocal,
        unloadLocal
    };
};
