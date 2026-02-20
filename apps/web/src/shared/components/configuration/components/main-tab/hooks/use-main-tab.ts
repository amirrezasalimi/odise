import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { CONFIG_KEYS } from "@/shared/constants/config";
import { LANGUAGES } from "@/shared/constants/languages";
import type { Key } from "@heroui/react";
import { useEmbeddingProviders } from "@/shared/components/configuration/components/embedding-tab/hooks/use-embedding-providers";

export function useMainTab() {
    const aiLanguage = useQuery(api.apis.config.getConfig, {
        key: CONFIG_KEYS.ai_language,
    });
    const enableSourcesEmbedding = useQuery(api.apis.config.getConfig, {
        key: CONFIG_KEYS.enable_sources_embedding,
    });
    const sourcesEmbeddingProvider = useQuery(api.apis.config.getConfig, {
        key: CONFIG_KEYS.sources_embedding_provider,
    });
    const setConfig = useMutation(api.apis.config.setConfig);

    const { apiProviders: embeddingProviders } = useEmbeddingProviders();

    const selectedKey: Key | null = (aiLanguage as Key | null) ?? "en";
    const isEmbeddingEnabled = enableSourcesEmbedding === true || enableSourcesEmbedding === "true";
    const selectedProviderId = (sourcesEmbeddingProvider as string) ?? "";

    const handleLanguageChange = async (key: Key | Key[] | null) => {
        if (typeof key === "string") {
            await setConfig({
                key: CONFIG_KEYS.ai_language,
                value: key,
            });
        }
    };

    const handleEmbeddingToggle = async (isSelected: boolean) => {
        await setConfig({
            key: CONFIG_KEYS.enable_sources_embedding,
            value: isSelected,
        });
    };

    const handleProviderChange = async (key: Key | Key[] | null) => {
        if (typeof key === "string") {
            await setConfig({
                key: CONFIG_KEYS.sources_embedding_provider,
                value: key,
            });
        }
    };

    const selectedLanguage = useMemo(
        () => LANGUAGES.find((lang) => lang.code === (aiLanguage ?? "en")),
        [aiLanguage]
    );

    const selectedProvider = useMemo(
        () => embeddingProviders.find((p) => p.id === selectedProviderId),
        [embeddingProviders, selectedProviderId]
    );

    const enabledEmbeddingProviders = useMemo(
        () => embeddingProviders.filter((p) => p.enabled),
        [embeddingProviders]
    );

    return {
        // Language config
        selectedKey,
        selectedLanguage,
        handleLanguageChange,

        // Embedding config
        isEmbeddingEnabled,
        selectedProviderId,
        selectedProvider,
        enabledEmbeddingProviders,
        handleEmbeddingToggle,
        handleProviderChange,
    };
}
