import { useQuery, useMutation } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { CONFIG_KEYS } from "@/shared/constants/config";
import type { TTSProvidersConfig, TTSProviderItem } from "@/shared/types/config";
import { nanoid } from "nanoid";
import { plugins_registry } from "@/shared/constants/plugins";
import { useMemo, useEffect, useCallback, useRef } from "react";

const generateId = (len = 10) => {
    try { return nanoid(len); }
    catch (e) { return Math.random().toString(36).substring(2, len + 2); }
};

export const useTTSConfig = () => {
    const ttsConfigRaw = useQuery(api.apis.config.getConfig, {
        key: CONFIG_KEYS.api_tts_providers
    });
    const updateConfig = useMutation(api.apis.config.setConfig);

    const isLoaded = typeof ttsConfigRaw !== "undefined";
    const refProviders = useRef<TTSProviderItem[]>([]);

    const storedProviders = useMemo(() => {
        if (!isLoaded || !ttsConfigRaw) return [] as TTSProviderItem[];
        try {
            const parsed = JSON.parse(ttsConfigRaw as string) as TTSProvidersConfig;
            // Filter out invalid entries (legacy or bugged)
            return (parsed.providers || []).filter(p => p.pluginId && p.id);
        } catch (e) {
            return [] as TTSProviderItem[];
        }
    }, [ttsConfigRaw, isLoaded]);

    const providers = useMemo(() => {
        if (!isLoaded) return [] as TTSProviderItem[];

        const localPlugins = plugins_registry.filter(p => {
            try {
                const temp = new p() as any;
                return temp.info?.type === "tts" && temp.options?.isLocal;
            } catch { return false; }
        });

        const activeProviders = [...storedProviders];
        localPlugins.forEach(PluginClass => {
            const temp = new PluginClass() as any;
            const pid = temp.info.id;
            if (!activeProviders.find(p => p.pluginId === pid)) {
                activeProviders.push({
                    id: pid,
                    pluginId: pid,
                    name: temp.info.name,
                    url: "",
                    apiKey: "",
                    enabled: true,
                    selectedModelId: temp.options?.defaultVariant || "",
                    customSpeakers: []
                });
            }
        });

        refProviders.current = activeProviders;
        return activeProviders;
    }, [storedProviders, isLoaded]);

    const saveProviders = useCallback(async (newProviders: TTSProviderItem[]) => {
        if (!isLoaded) return;

        // Final sanity check: don't save empty pluginIds
        const cleanProviders = newProviders
            .filter(p => p.pluginId)
            .map(({ id, name, url, apiKey, enabled, selectedModelId, customSpeakers, pluginId }) => ({
                id, name, url, apiKey, enabled, selectedModelId, customSpeakers, pluginId
            }));

        await updateConfig({
            key: CONFIG_KEYS.api_tts_providers,
            value: JSON.stringify({ providers: cleanProviders })
        });
    }, [isLoaded, updateConfig]);

    useEffect(() => {
        if (isLoaded && providers.length !== storedProviders.length) {
            saveProviders(providers);
        }
    }, [isLoaded, providers.length, storedProviders.length, saveProviders, providers]);

    const addProvider = async (pluginId: string, name: string, url: string = "", apiKey: string = "") => {
        if (!isLoaded || !pluginId) return;
        const newProvider: TTSProviderItem = {
            id: generateId(10),
            pluginId,
            name,
            url,
            apiKey,
            enabled: true,
            customSpeakers: []
        };
        const newList = [...refProviders.current, newProvider];
        await saveProviders(newList);
    };

    const updateProvider = async (id: string, updates: Partial<TTSProviderItem>) => {
        if (!isLoaded) return;
        const newList = refProviders.current.map(p => p.id === id ? { ...p, ...updates } : p);
        await saveProviders(newList);
    };

    const deleteProvider = async (id: string) => {
        if (!isLoaded) return;
        const newList = refProviders.current.filter(p => p.id !== id);
        await saveProviders(newList);
    };

    return {
        providers,
        isLoading: !isLoaded,
        addProvider,
        updateProvider,
        deleteProvider
    };
};
