import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { CONFIG_KEYS } from "@/shared/constants/config";
import type { ApiTTSProviderItem } from "@/shared/types/config";

export function useApiProviders() {
    const [apiProviders, setApiProviders] = useState<ApiTTSProviderItem[]>([]);
    const [providersWithErrors, setProvidersWithErrors] = useState<Record<string, boolean>>({});

    const configQuery = useQuery(api.apis.notebook.getConfig, { key: CONFIG_KEYS.api_tts_providers });
    const setConfig = useMutation(api.apis.notebook.setConfig);

    // Load providers from config
    useEffect(() => {
        if (configQuery?.value) {
            try {
                const config = JSON.parse(configQuery.value as string) as { providers: ApiTTSProviderItem[] };
                setApiProviders(config.providers.map(p => ({ ...p })));
            } catch (error) {
                console.error("Failed to parse API TTS providers config:", error);
            }
        }
    }, [configQuery]);

    const saveConfig = async (providers: ApiTTSProviderItem[]) => {
        const config = { providers };
        await setConfig({
            key: CONFIG_KEYS.api_tts_providers,
            value: JSON.stringify(config),
        });
    };

    const updateProvider = (providerUid: string, updates: Partial<ApiTTSProviderItem>) => {
        const updatedProviders = apiProviders.map(p =>
            p.uid === providerUid ? { ...p, ...updates } : p
        );
        setApiProviders(updatedProviders);
        return updatedProviders;
    };

    const addProvider = (provider: ApiTTSProviderItem) => {
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
