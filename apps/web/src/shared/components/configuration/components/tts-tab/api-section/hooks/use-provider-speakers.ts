import { useEffect, useState, useCallback } from "react";
import type { TTSProvider, TTSProviderSpeaker } from "@odise/types";
import type { ApiTTSProviderItem } from "@/shared/types/config";

export interface ApiProviderWithSpeakers extends ApiTTSProviderItem {
    speakers?: TTSProviderSpeaker[];
    isLoadingSpeakers?: boolean;
    errorLoadingSpeakers?: boolean;
}

interface UseProviderSpeakersProps {
    apiProviders: ApiProviderWithSpeakers[];
    setApiProviders: React.Dispatch<React.SetStateAction<ApiProviderWithSpeakers[]>>;
    providersWithErrors: Record<string, boolean>;
    getSpeakers: (pluginId: string) => Promise<TTSProviderSpeaker[]>;
    configureNonLocalProvider: (pluginId: string, config: { apiKey: string; url: string }) => TTSProvider | null;
}

export function useProviderSpeakers({
    apiProviders,
    setApiProviders,
    providersWithErrors,
    getSpeakers,
    configureNonLocalProvider,
}: UseProviderSpeakersProps) {
    const [selectedSpeakers, setSelectedSpeakers] = useState<Record<string, string>>({});
    const [testLoading, setTestLoading] = useState<Record<string, boolean>>({});

    // Load speakers for enabled providers
    useEffect(() => {
        apiProviders.forEach(provider => {
            if (provider.enabled && !provider.speakers && !provider.isLoadingSpeakers && !provider.errorLoadingSpeakers && !providersWithErrors[provider.uid]) {
                loadProviderSpeakers(provider.uid);
            }
        });
    }, [apiProviders, providersWithErrors]);

    // Select default speaker when speakers are loaded
    useEffect(() => {
        apiProviders.forEach(provider => {
            if (provider.speakers && provider.speakers.length > 0 && !selectedSpeakers[provider.uid]) {
                setSelectedSpeakers(prev => ({ ...prev, [provider.uid]: provider.speakers![0].id }));
            }
        });
    }, [apiProviders, selectedSpeakers]);

    const loadProviderSpeakers = async (providerUid: string) => {
        const provider = apiProviders.find(p => p.uid === providerUid);
        if (!provider) return;

        setApiProviders(prev =>
            prev.map(p =>
                p.uid === providerUid ? { ...p, isLoadingSpeakers: true, errorLoadingSpeakers: false } : p
            )
        );

        try {
            const configuredPlugin = configureNonLocalProvider(provider.id, {
                apiKey: provider.apiKey,
                url: provider.url,
            });

            if (!configuredPlugin) {
                throw new Error(`Failed to configure provider ${provider.id}`);
            }

            const speakers = await configuredPlugin.getSpeakers();
            setApiProviders(prev =>
                prev.map(p =>
                    p.uid === providerUid ? { ...p, speakers, isLoadingSpeakers: false, errorLoadingSpeakers: false } : p
                )
            );
        } catch (error) {
            console.error(`Failed to load speakers for provider ${provider.id}:`, error);
            setApiProviders(prev =>
                prev.map(p =>
                    p.uid === providerUid ? { ...p, isLoadingSpeakers: false, errorLoadingSpeakers: true } : p
                )
            );
            // Don't throw error - we've handled it by setting errorLoadingSpeakers
        }
    };

    const handleSpeakerSelect = (providerUid: string, speakerId: string) => {
        setSelectedSpeakers(prev => ({ ...prev, [providerUid]: speakerId }));
    };

    const handleTestSpeaker = async (providerUid: string, selectedVariantId?: string) => {
        const provider = apiProviders.find(p => p.uid === providerUid);
        const selectedSpeakerId = selectedSpeakers[providerUid];

        if (!provider || !selectedSpeakerId) return;

        const configuredPlugin = configureNonLocalProvider(provider.id, {
            apiKey: provider.apiKey,
            url: provider.url,
        });

        if (!configuredPlugin) return;

        setTestLoading(prev => ({ ...prev, [providerUid]: true }));

        try {
            const result = await configuredPlugin.speak({
                text: "Moonlight lingers softly on silent waters.",
                speakerId: selectedSpeakerId,
                variantId: selectedVariantId
            });

            if (result.result?.audio) {
                const audio = new Audio(URL.createObjectURL(result.result.audio));
                audio.play();
            }
        } catch (error) {
            console.error(`Failed to test speaker for provider ${provider.id}:`, error);
        } finally {
            setTestLoading(prev => ({ ...prev, [providerUid]: false }));
        }
    };

    // Memoized function to combine API speakers with custom speakers
    const getCombinedSpeakers = useCallback((provider: ApiProviderWithSpeakers): TTSProviderSpeaker[] => {
        const apiSpeakers = provider.speakers || [];
        const customSpeakers = provider.customSpeakers || [];

        const customSpeakerObjects: TTSProviderSpeaker[] = customSpeakers.map((name, index) => ({
            id: `custom-${index}`,
            name: name,
        }));

        return [...apiSpeakers, ...customSpeakerObjects];
    }, []);

    return {
        selectedSpeakers,
        testLoading,
        loadProviderSpeakers,
        handleSpeakerSelect,
        handleTestSpeaker,
        getCombinedSpeakers,
    };
}
