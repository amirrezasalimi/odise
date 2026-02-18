import { useEffect, useState } from "react";
import type { TTSProvider, TTSProviderVariant } from "@odise/types";
import type { ApiTTSProviderItem } from "@/shared/types/config";

export interface ApiProviderWithVariants extends ApiTTSProviderItem {
    variants?: TTSProviderVariant[];
    isLoadingVariants?: boolean;
    errorLoadingVariants?: boolean;
}

interface UseProviderVariantsProps {
    apiProviders: ApiProviderWithVariants[];
    setApiProviders: React.Dispatch<React.SetStateAction<ApiProviderWithVariants[]>>;
    plugins: TTSProvider[];
    configureNonLocalProvider: (pluginId: string, config: { apiKey: string; url: string }) => TTSProvider | null;
}

export function useProviderVariants({
    apiProviders,
    setApiProviders,
    plugins,
    configureNonLocalProvider,
}: UseProviderVariantsProps) {
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

    // Load variants for enabled providers
    useEffect(() => {
        apiProviders.forEach(provider => {
            if (provider.enabled && !provider.variants && !provider.isLoadingVariants && !provider.errorLoadingVariants) {
                const plugin = plugins.find(p => p.info?.id === provider.id);
                if (plugin?.options?.hasVariants) {
                    loadProviderVariants(provider.uid);
                }
            }
        });
    }, [apiProviders, plugins]);

    const loadProviderVariants = async (providerUid: string) => {
        const provider = apiProviders.find(p => p.uid === providerUid);
        if (!provider) return;

        const plugin = plugins.find(p => p.info?.id === provider.id);
        if (!plugin?.options?.hasVariants) return;

        setApiProviders(prev =>
            prev.map(p =>
                p.uid === providerUid ? { ...p, isLoadingVariants: true, errorLoadingVariants: false } : p
            )
        );

        try {
            const configuredPlugin = configureNonLocalProvider(provider.id, {
                apiKey: provider.apiKey,
                url: provider.url,
            });

            if (!configuredPlugin?.loadVariants) {
                throw new Error(`Provider ${provider.id} does not support loadVariants`);
            }

            const variants = await configuredPlugin.loadVariants();
            setApiProviders(prev =>
                prev.map(p =>
                    p.uid === providerUid ? { ...p, variants, isLoadingVariants: false, errorLoadingVariants: false } : p
                )
            );
        } catch (error) {
            console.error(`Failed to load variants for provider ${provider.id}:`, error);
            setApiProviders(prev =>
                prev.map(p =>
                    p.uid === providerUid ? { ...p, isLoadingVariants: false, errorLoadingVariants: true } : p
                )
            );
            // Don't throw error - we've handled it by setting errorLoadingVariants
        }
    };

    const handleVariantChange = async (
        providerUid: string,
        key: React.Key | null,
        saveConfig: (providers: ApiTTSProviderItem[]) => Promise<void>
    ) => {
        if (!key) return;
        const variantId = String(key);

        setSelectedVariants(prev => ({ ...prev, [providerUid]: variantId }));

        const updatedProviders = apiProviders.map(p =>
            p.uid === providerUid ? { ...p, selectedModelId: variantId } : p
        );
        setApiProviders(updatedProviders);

        await saveConfig(updatedProviders);
    };

    return {
        selectedVariants,
        loadProviderVariants,
        handleVariantChange,
    };
}
