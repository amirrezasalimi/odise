import { useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import type { EmbeddingProvider } from "@odise/types";
import { convex } from "@/shared/components/layout/index";
import useAppStore from "../store/app";
import { plugins_registry, DEFAULT_EMBEDDING_MODELS } from "../constants/plugins";
import { CONFIG_KEYS } from "../constants/config";
import type { EmbeddingProvidersConfig, EmbeddingProviderItem } from "../types/config";
import { Mutex } from "../utils/mutex";

const freshMutex = new Mutex();

type PluginInstance = EmbeddingProvider & { info?: { id?: string; type?: string }; options?: { isLocal?: boolean } };

export interface ResolvedEmbeddingProvider {
    instance: EmbeddingProvider;
    config?: EmbeddingProviderItem;
    isLocal: boolean;
    pluginId: string;
    id: string;
}

const parseEmbeddingConfig = (raw: string | undefined | null): EmbeddingProviderItem[] => {
    if (!raw) return [];
    try {
        return ((JSON.parse(raw) as EmbeddingProvidersConfig).providers ?? []).filter(p => p.pluginId && p.id);
    } catch { return []; }
};

const findPluginClass = (pluginId: string, isLocal: boolean) =>
    plugins_registry.find(p => {
        try {
            const t = new p() as PluginInstance;
            return t.info?.type === "embedding" && t.info?.id === pluginId && !!t.options?.isLocal === isLocal;
        } catch { return false; }
    });

const getPluginId = (instance: EmbeddingProvider, fallback: string) =>
    (instance as PluginInstance).info?.id ?? fallback;

const buildNonLocalEmbedding = (items: EmbeddingProviderItem[]): ResolvedEmbeddingProvider[] =>
    items.filter(i => i.enabled).flatMap(item => {
        const Cls = findPluginClass(item.pluginId, false);
        if (!Cls) return [];
        const instance = new Cls() as EmbeddingProvider;
        instance.setConfig?.({ apiKey: item.apiKey, url: item.url });
        return [{ instance, config: item, isLocal: false, pluginId: item.pluginId, id: item.id }];
    });

const buildLocalEmbedding = (local: Record<string, EmbeddingProvider>): ResolvedEmbeddingProvider[] =>
    Object.entries(local).map(([id, instance]) => ({
        instance, isLocal: true, pluginId: getPluginId(instance, id), id,
    }));

const buildLocalEmbeddingFromRegistry = (items: EmbeddingProviderItem[]): ResolvedEmbeddingProvider[] =>
    DEFAULT_EMBEDDING_MODELS.map(model => {
        const Cls = findPluginClass(model.pluginId, true);
        if (!Cls) return null;
        const instance = new Cls() as EmbeddingProvider;
        if (instance.setConfig) {
            instance.setConfig({
                model: model.modelId,
                runtime: "wasm",
                quantization: "fp32"
            });
        }
        const config = items.find(p => p.pluginId === model.pluginId);
        return {
            instance,
            isLocal: true,
            pluginId: model.pluginId,
            id: model.id,
            config: {
                enabled: config?.enabled ?? true,
            }
        } as ResolvedEmbeddingProvider
    }).filter((p): p is ResolvedEmbeddingProvider => p !== null);

const isEmbeddingInSync = (id: string, instance: EmbeddingProvider, items: EmbeddingProviderItem[]) => {
    if (!findPluginClass(getPluginId(instance, id), true)) return false;
    const config = items.find(p => p.id === id);
    if (config?.selectedModelId && config.selectedModelId !== instance.selectedVariantId) return false;
    return true;
};

const useEmbedding = () => {
    const { localEmbedding, removeLocalEmbedding, setLocalEmbedding } = useAppStore();
    const embeddingConfigRaw = useQuery(api.apis.config.getConfig, { key: CONFIG_KEYS.embedding_providers });


    const syncLocal = useCallback(async (items: EmbeddingProviderItem[]) => {
        for (const [id, instance] of Object.entries(useAppStore.getState().localEmbedding)) {
            if (!isEmbeddingInSync(id, instance, items)) {
                try { await instance.unload?.(); } catch { }
                removeLocalEmbedding(id);
            }
        }
    }, [removeLocalEmbedding]);

    const getProviders = useCallback(async (fresh = false): Promise<ResolvedEmbeddingProvider[]> => {
        if (!fresh) {
            const items = parseEmbeddingConfig(embeddingConfigRaw as string);
            return [...buildLocalEmbedding(localEmbedding), ...buildNonLocalEmbedding(items)];
        }
        return freshMutex.run(async () => {
            const raw = await convex.query(api.apis.config.getConfig, { key: CONFIG_KEYS.embedding_providers });

            const items = parseEmbeddingConfig(raw as string);
            console.log("raw", raw);
            console.log("items", items);

            await syncLocal(items);
            return [...buildLocalEmbeddingFromRegistry(items), ...buildNonLocalEmbedding(items)];
        });
    }, [embeddingConfigRaw, localEmbedding, syncLocal]);

    const getProvider = useCallback(async (id: string, fresh = false): Promise<ResolvedEmbeddingProvider | undefined> => {
        if (!fresh) {
            if (localEmbedding[id]) return { instance: localEmbedding[id], isLocal: true, pluginId: getPluginId(localEmbedding[id], id), id };
            const item = parseEmbeddingConfig(embeddingConfigRaw as string).find(p => p.id === id);
            return item ? buildNonLocalEmbedding([item])[0] : undefined;
        }
        return freshMutex.run(async () => {
            const raw = await convex.query(api.apis.config.getConfig, { key: CONFIG_KEYS.embedding_providers });
            const items = parseEmbeddingConfig(raw as string);
            await syncLocal(items);
            const freshLocal = useAppStore.getState().localEmbedding;
            if (freshLocal[id]) return { instance: freshLocal[id], isLocal: true, pluginId: getPluginId(freshLocal[id], id), id };

            // Try to find and load local provider from DEFAULT_EMBEDDING_MODELS
            const defaultModel = DEFAULT_EMBEDDING_MODELS.find(m => m.id === id);
            if (defaultModel) {
                const Cls = findPluginClass(defaultModel.pluginId, true);
                if (Cls) {
                    const instance = new Cls() as EmbeddingProvider;
                    if (instance.setConfig) {
                        instance.setConfig({
                            model: defaultModel.modelId,
                            runtime: "wasm",
                            quantization: "fp32"
                        });
                    }
                    if (instance.load) {
                        await instance.load(undefined, () => { });
                    }
                    instance.selectedVariantId = defaultModel.modelId;
                    setLocalEmbedding(id, instance);
                    return { instance, isLocal: true, pluginId: defaultModel.pluginId, id };
                }
            }

            const item = items.find(p => p.id === id);
            return item ? buildNonLocalEmbedding([item])[0] : undefined;
        });
    }, [embeddingConfigRaw, localEmbedding, syncLocal, setLocalEmbedding]);

    const providers = useMemo(() => {
        const items = parseEmbeddingConfig(embeddingConfigRaw as string);
        return [...buildLocalEmbedding(localEmbedding), ...buildNonLocalEmbedding(items)];
    }, [embeddingConfigRaw, localEmbedding]);

    return { localEmbedding, providers, getProviders, getProvider };
};

export default useEmbedding;
