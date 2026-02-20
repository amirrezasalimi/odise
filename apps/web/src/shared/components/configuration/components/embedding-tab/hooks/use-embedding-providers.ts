import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { CONFIG_KEYS } from "@/shared/constants/config";
import type { EmbeddingProviderItem } from "@/shared/types/config";

export function useEmbeddingProviders() {
    const [apiProviders, setApiProviders] = useState<EmbeddingProviderItem[]>([]);
    const [providersWithErrors, setProvidersWithErrors] = useState<Record<string, boolean>>({});

    const configQuery = useQuery(api.apis.config.getConfig, { key: CONFIG_KEYS.embedding_providers });
    const setConfig = useMutation(api.apis.config.setConfig);

    // Load providers from config
    useEffect(() => {
        if (configQuery) {
            try {
                const config = JSON.parse(configQuery as string) as { providers: EmbeddingProviderItem[] };
                setApiProviders(config.providers.map(p => ({ ...p })));
            } catch (error) {
                console.error("Failed to parse API Embedding providers config:", error);
            }
        }
    }, [configQuery]);

    const saveConfig = async (providers: EmbeddingProviderItem[]) => {
        const config = { providers };
        await setConfig({
            key: CONFIG_KEYS.embedding_providers,
            value: JSON.stringify(config),
        });
    };

    const updateProvider = (providerId: string, updates: Partial<EmbeddingProviderItem>) => {
        const updatedProviders = apiProviders.map(p =>
            p.id === providerId ? { ...p, ...updates } : p
        );
        setApiProviders(updatedProviders);
        return updatedProviders;
    };

    const addProvider = (provider: EmbeddingProviderItem) => {
        const updatedProviders = [...apiProviders, provider];
        setApiProviders(updatedProviders);
        return updatedProviders;
    };

    const removeProvider = (providerId: string) => {
        const updatedProviders = apiProviders.filter(p => p.id !== providerId);
        setApiProviders(updatedProviders);
        return updatedProviders;
    };

    const clearProviderError = (providerId: string) => {
        setProvidersWithErrors(prev => {
            const { [providerId]: _, ...rest } = prev;
            return rest;
        });
    };

    return {
        apiProviders,
        setApiProviders,
        providersWithErrors,
        saveConfig,
        updateProvider,
        addProvider,
        removeProvider,
        clearProviderError,
    };
}
