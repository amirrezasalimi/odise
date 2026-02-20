import { useState } from "react";
import OpenAI from "openai";
import type { EmbeddingProviderItem } from "@/shared/types/config";

export interface Model {
    id: string;
    name: string;
}

export function useProviderActions() {
    const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});
    const [isFetchingModels, setIsFetchingModels] = useState<Record<string, boolean>>({});
    const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

    const testProvider = async (provider: EmbeddingProviderItem): Promise<{ success: boolean; message: string }> => {
        setIsTesting(prev => ({ ...prev, [provider.id]: true }));

        try {
            const client = new OpenAI({
                apiKey: provider.apiKey,
                baseURL: provider.url,
                dangerouslyAllowBrowser: true,
            });

            // Test by listing models (common way to verify API key/url)
            await client.models.list();

            const result = { success: true, message: "Connection successful" };
            setTestResults(prev => ({ ...prev, [provider.id]: result }));
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Connection failed";
            const result = { success: false, message };
            setTestResults(prev => ({ ...prev, [provider.id]: result }));
            return result;
        } finally {
            setIsTesting(prev => ({ ...prev, [provider.id]: false }));
        }
    };

    const fetchModels = async (provider: EmbeddingProviderItem): Promise<Model[]> => {
        setIsFetchingModels(prev => ({ ...prev, [provider.id]: true }));

        try {
            const client = new OpenAI({
                apiKey: provider.apiKey,
                baseURL: provider.url,
                dangerouslyAllowBrowser: true,
            });

            const response = await client.models.list();
            // Filter to include only models that likely support embedding (or just show all for now like LLM does)
            const models: Model[] = response.data.map(model => ({
                id: model.id,
                name: model.id,
            }));

            return models;
        } catch (error) {
            console.error("Failed to fetch models:", error);
            return [];
        } finally {
            setIsFetchingModels(prev => ({ ...prev, [provider.id]: false }));
        }
    };

    return {
        isTesting,
        isFetchingModels,
        testResults,
        testProvider,
        fetchModels,
    };
}
