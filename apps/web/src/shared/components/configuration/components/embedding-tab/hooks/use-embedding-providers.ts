import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { CONFIG_KEYS } from "@/shared/constants/config";
import type { EmbeddingProviderItem, EmbeddingProvidersConfig } from "@/shared/types/config";
import { DEFAULT_EMBEDDING_MODELS } from "@/shared/constants/plugins";


export function useEmbeddingProviders() {
    const configQuery = useQuery(api.apis.config.getConfig, { key: CONFIG_KEYS.embedding_providers });
    const setConfig = useMutation(api.apis.config.setConfig);

    const isLoaded = typeof configQuery !== "undefined";
    const refProviders = useRef<EmbeddingProviderItem[]>([]);
    const [providersWithErrors, setProvidersWithErrors] = useState<Record<string, boolean>>({});

    const storedProviders = useMemo(() => {
        if (!isLoaded || !configQuery) return [] as EmbeddingProviderItem[];
        try {
            const config = JSON.parse(configQuery as string) as EmbeddingProvidersConfig;
            return (config.providers || []).filter(p => p.pluginId && p.id);
        } catch (error) {
            console.error("Failed to parse API Embedding providers config:", error);
            return [] as EmbeddingProviderItem[];
        }
    }, [configQuery, isLoaded]);

    const providers = useMemo(() => {
        if (!isLoaded) return [] as EmbeddingProviderItem[];

        const activeProviders = [...storedProviders];

        DEFAULT_EMBEDDING_MODELS.forEach((model) => {
            if (!activeProviders.find(p => p.id === model.id)) {
                activeProviders.push({
                    id: model.id,
                    pluginId: model.pluginId,
                    name: model.name,
                    url: "",
                    apiKey: "",
                    enabled: true,
                    selectedModelId: model.modelId
                });
            }
        });

        refProviders.current = activeProviders;
        return activeProviders;
    }, [storedProviders, isLoaded]);

    const saveConfig = useCallback(async (newProviders: EmbeddingProviderItem[]) => {
        if (!isLoaded) return;

        const cleanProviders = newProviders
            .filter(p => p.pluginId)
            .map(({ id, name, url, apiKey, enabled, selectedModelId, models, pluginId }) => ({
                id, name, url, apiKey, enabled, selectedModelId, models, pluginId
            }));

        await setConfig({
            key: CONFIG_KEYS.embedding_providers,
            value: JSON.stringify({ providers: cleanProviders }),
        });
    }, [isLoaded, setConfig]);

    useEffect(() => {
        if (isLoaded && providers.length !== storedProviders.length) {
            saveConfig(providers);
        }
    }, [isLoaded, providers.length, storedProviders.length, saveConfig, providers]);

    // Handlers matching original contract
    const updateProvider = (providerId: string, updates: Partial<EmbeddingProviderItem>) => {
        const updatedProviders = refProviders.current.map(p =>
            p.id === providerId ? { ...p, ...updates } : p
        );
        saveConfig(updatedProviders);
        return updatedProviders;
    };

    const addProvider = (provider: EmbeddingProviderItem) => {
        const updatedProviders = [...refProviders.current, provider];
        saveConfig(updatedProviders);
        return updatedProviders;
    };

    const removeProvider = (providerId: string) => {
        const updatedProviders = refProviders.current.filter(p => p.id !== providerId);
        saveConfig(updatedProviders);
        return updatedProviders;
    };

    const clearProviderError = (providerId: string) => {
        setProvidersWithErrors(prev => {
            const { [providerId]: _, ...rest } = prev;
            return rest;
        });
    };

    // To maintain backward compatibility with `apiProviders` and `setApiProviders` usage in other parts
    const setApiProviders = (ps: EmbeddingProviderItem[] | ((prev: EmbeddingProviderItem[]) => EmbeddingProviderItem[])) => {
        if (typeof ps === 'function') {
            const newProviders = ps(refProviders.current);
            saveConfig(newProviders);
        } else {
            saveConfig(ps);
        }
    };

    return {
        apiProviders: providers,
        setApiProviders,
        providersWithErrors,
        saveConfig,
        updateProvider,
        addProvider,
        removeProvider,
        clearProviderError,
    };
}
