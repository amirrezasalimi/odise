import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { CONFIG_KEYS } from "@/shared/constants/config";
import type { ApiLLMProviderItem } from "@/shared/types/config";

export function useLLMProviders() {
    const [apiProviders, setApiProviders] = useState<ApiLLMProviderItem[]>([]);
    const [providersWithErrors, setProvidersWithErrors] = useState<Record<string, boolean>>({});

    const configQuery = useQuery(api.apis.config.getConfig, { key: CONFIG_KEYS.api_llm_providers });
    const setConfig = useMutation(api.apis.config.setConfig);

    // Load providers from config
    useEffect(() => {
        if (configQuery) {
            try {
                const config = JSON.parse(configQuery as string) as { providers: ApiLLMProviderItem[] };
                setApiProviders(config.providers.map(p => ({ ...p })));
            } catch (error) {
                console.error("Failed to parse API LLM providers config:", error);
            }
        }
    }, [configQuery]);

    const saveConfig = async (providers: ApiLLMProviderItem[]) => {
        const config = { providers };
        await setConfig({
            key: CONFIG_KEYS.api_llm_providers,
            value: JSON.stringify(config),
        });
    };

    const updateProvider = (providerUid: string, updates: Partial<ApiLLMProviderItem>) => {
        const updatedProviders = apiProviders.map(p =>
            p.uid === providerUid ? { ...p, ...updates } : p
        );
        setApiProviders(updatedProviders);
        return updatedProviders;
    };

    const addProvider = (provider: ApiLLMProviderItem) => {
        const updatedProviders = [...apiProviders, provider];
        setApiProviders(updatedProviders);
        return updatedProviders;
    };

    const removeProvider = (providerUid: string) => {
        const updatedProviders = apiProviders.filter(p => p.uid !== providerUid);
        setApiProviders(updatedProviders);
        return updatedProviders;
    };

    const clearProviderError = (providerUid: string) => {
        setProvidersWithErrors(prev => {
            const { [providerUid]: _, ...rest } = prev;
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
