import { useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import type { TTSProvider } from "@odise/types";
import { convex } from "@/shared/components/layout/index";
import useAppStore from "../store/app";
import { plugins_registry } from "../constants/plugins";
import { CONFIG_KEYS } from "../constants/config";
import type { TTSProvidersConfig, TTSProviderItem } from "../types/config";
import { Mutex } from "../utils/mutex";

const freshMutex = new Mutex();

type PluginInstance = TTSProvider & { info?: { id?: string; type?: string }; options?: { isLocal?: boolean } };

export interface ResolvedTTSProvider {
    instance: TTSProvider;
    config?: TTSProviderItem;
    isLocal: boolean;
    pluginId: string;
    id: string;
}

const parseTTSConfig = (raw: string | undefined | null): TTSProviderItem[] => {
    if (!raw) return [];
    try {
        return ((JSON.parse(raw) as TTSProvidersConfig).providers ?? []).filter(p => p.pluginId && p.id);
    } catch { return []; }
};

const findPluginClass = (pluginId: string, isLocal: boolean, type: string) =>
    plugins_registry.find(p => {
        try {
            const t = new p() as PluginInstance;
            return t.info?.type === type && t.info?.id === pluginId && !!t.options?.isLocal === isLocal;
        } catch { return false; }
    });

const buildNonLocalTTS = (items: TTSProviderItem[]): ResolvedTTSProvider[] =>
    items.filter(i => i.enabled).flatMap(item => {
        const Cls = findPluginClass(item.pluginId, false, "tts");
        if (!Cls) return [];
        const instance = new Cls() as TTSProvider;
        instance.setConfig?.({ apiKey: item.apiKey, url: item.url });
        return [{ instance, config: item, isLocal: false, pluginId: item.pluginId, id: item.id }];
    });

const buildLocalTTS = (localTTS: Record<string, TTSProvider>): ResolvedTTSProvider[] =>
    Object.entries(localTTS).map(([pluginId, instance]) => ({ instance, isLocal: true, pluginId, id: pluginId }));

const buildLocalTTSFromRegistry = (items: TTSProviderItem[]): ResolvedTTSProvider[] =>
    plugins_registry
        .map(Cls => {
            try {
                const t = new Cls() as PluginInstance;
                if (t.info?.type === "tts" && t.options?.isLocal === true) {
                    const config = items.find(p => p.pluginId === t.info.id);
                    const instance = new Cls() as TTSProvider;
                    if (config && instance.setConfig) {
                        instance.setConfig({ apiKey: config.apiKey, url: config.url });
                    }
                    return {
                        instance,
                        isLocal: true,
                        pluginId: t.info.id,
                        id: t.info.id,
                    };
                }
                return null;
            } catch {
                return null;
            }
        })
        .filter((p): p is ResolvedTTSProvider => p !== null);

const isTTSInSync = (pluginId: string, instance: TTSProvider, items: TTSProviderItem[]) => {
    if (!findPluginClass(pluginId, true, "tts")) return false;
    const config = items.find(p => p.pluginId === pluginId);
    if (config?.selectedModelId && config.selectedModelId !== instance.selectedVariantId) return false;
    return true;
};

const useTTS = () => {
    const { localTTS, removeLocalTTS, setLocalTTS } = useAppStore();
    const ttsConfigRaw = useQuery(api.apis.config.getConfig, { key: CONFIG_KEYS.api_tts_providers });

    const providers = useMemo(() => {
        const items = parseTTSConfig(ttsConfigRaw as string);
        return [...buildLocalTTS(localTTS), ...buildNonLocalTTS(items)];
    }, [ttsConfigRaw, localTTS]);

    const syncLocal = useCallback(async (items: TTSProviderItem[]) => {
        for (const [pluginId, instance] of Object.entries(useAppStore.getState().localTTS)) {
            if (!isTTSInSync(pluginId, instance, items)) {
                try { await instance.unload?.(); } catch { }
                removeLocalTTS(pluginId);
            }
        }
    }, [removeLocalTTS]);

    const getProviders = useCallback(async (fresh = false): Promise<ResolvedTTSProvider[]> => {
        if (!fresh) {
            const items = parseTTSConfig(ttsConfigRaw as string);
            return [...buildLocalTTS(localTTS), ...buildNonLocalTTS(items)];
        }
        return freshMutex.run(async () => {
            const raw = await convex.query(api.apis.config.getConfig, { key: CONFIG_KEYS.api_tts_providers });
            const items = parseTTSConfig(raw as string);
            await syncLocal(items);
            return [...buildLocalTTSFromRegistry(items), ...buildNonLocalTTS(items)];
        });
    }, [ttsConfigRaw, localTTS, syncLocal]);

    const getProvider = useCallback(async (id: string, fresh = false): Promise<ResolvedTTSProvider | undefined> => {
        if (!fresh) {
            if (localTTS[id]) return { instance: localTTS[id], isLocal: true, pluginId: id, id };
            const item = parseTTSConfig(ttsConfigRaw as string).find(p => p.id === id);
            return item ? buildNonLocalTTS([item])[0] : undefined;
        }
        return freshMutex.run(async () => {
            const raw = await convex.query(api.apis.config.getConfig, { key: CONFIG_KEYS.api_tts_providers });
            const items = parseTTSConfig(raw as string);
            await syncLocal(items);
            const freshLocal = useAppStore.getState().localTTS;
            if (freshLocal[id]) return { instance: freshLocal[id], isLocal: true, pluginId: id, id };

            // Try to find and load local provider from registry
            const Cls = findPluginClass(id, true, "tts");
            if (Cls) {
                const config = items.find(p => p.pluginId === id);
                const instance = new Cls() as TTSProvider;
                if (instance.load) {
                    await instance.load(config?.selectedModelId, () => { });
                }
                instance.selectedVariantId = config?.selectedModelId;
                setLocalTTS(id, instance);
                return { instance, isLocal: true, pluginId: id, id };
            }

            const item = items.find(p => p.id === id);
            return item ? buildNonLocalTTS([item])[0] : undefined;
        });
    }, [ttsConfigRaw, localTTS, syncLocal, setLocalTTS]);

    return { localTTS, providers, getProviders, getProvider };
};

export default useTTS;
