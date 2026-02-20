import useAppStore from "@/shared/store/app";
import { plugins_registry } from "@/shared/constants/plugins";
import { useState } from "react";
import type { EmbeddingProvider } from "@odise/types";

export interface LocalModelConfig {
    id: string;
    name: string;
    pluginId: string;
    modelId: string;
    dimension: number;
    runtime?: "webgpu" | "wasm";
    quantization?: string;
}

export const useLocalEmbedding = () => {
    const { localEmbedding, setLocalEmbedding, removeLocalEmbedding } = useAppStore();
    const [loadingProgress, setLoadingProgress] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

    const loadLocal = async (config: LocalModelConfig) => {
        const { id, pluginId, modelId, runtime, quantization } = config;

        // If another model is already loaded for this plugin, unload it?
        // Or handle multiple instances? For now, let's allow co-existence if IDs differ.
        if (localEmbedding[id]) {
            await unloadLocal(id);
        }

        const PluginClass = plugins_registry.find(p => {
            const temp = new p() as any;
            return temp.info?.id === pluginId && temp.options?.isLocal;
        });

        if (!PluginClass) return;

        setIsLoading(prev => ({ ...prev, [id]: true }));
        setLoadingProgress(prev => ({ ...prev, [id]: 0 }));

        try {
            const instance = new PluginClass() as EmbeddingProvider;

            // Configure the instance before loading
            if (instance.setConfig) {
                instance.setConfig({
                    model: modelId,
                    runtime: runtime || "wasm",
                    quantization: quantization || "fp32"
                });
            }

            if (instance.load) {
                await instance.load(undefined, (progress) => {
                    setLoadingProgress(prev => ({ ...prev, [id]: progress }));
                });
            }

            instance.selectedVariantId = modelId;
            setLocalEmbedding(id, instance);

        } catch (error) {
            console.error(`Failed to load local embedding ${id}:`, error);
        } finally {
            setIsLoading(prev => ({ ...prev, [id]: false }));
            setLoadingProgress(prev => ({ ...prev, [id]: 100 }));
        }
    };

    const unloadLocal = async (id: string) => {
        const instance = localEmbedding[id];
        if (!instance) return;

        try {
            if (instance.unload) {
                await instance.unload();
            }
        } catch (error) {
            console.error(`Failed to unload local embedding ${id}:`, error);
        } finally {
            removeLocalEmbedding(id);
            setLoadingProgress(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            setIsLoading(prev => {
                const nextState = { ...prev };
                delete nextState[id];
                return nextState;
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
