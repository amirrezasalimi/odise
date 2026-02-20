import { useState } from "react";
import type { EmbeddingProviderVariant } from "@odise/types";
import { plugins_registry } from "@/shared/constants/plugins";

export const useProviderData = () => {
    const [variants, setVariants] = useState<Record<string, EmbeddingProviderVariant[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    const loadVariants = async (id: string, pluginId: string) => {
        setIsLoading(true);
        try {
            const PluginClass = plugins_registry.find(p => {
                try {
                    return (new p() as any).info.id === pluginId;
                } catch { return false; }
            });

            if (!PluginClass) return;

            const instance = new PluginClass() as any;
            if (instance.loadVariants) {
                const v = await instance.loadVariants();
                setVariants(prev => ({ ...prev, [id]: v }));
            }
        } catch (error) {
            console.error("Failed to load variants:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        variants,
        isLoading,
        loadVariants,
    };
};
