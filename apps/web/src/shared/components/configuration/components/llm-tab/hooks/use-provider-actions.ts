import { useState } from "react";
import OpenAI from "openai";
import type { ApiLLMProviderItem } from "@/shared/types/config";

export interface Model {
    id: string;
    name: string;
}

export function useProviderActions() {
    const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});
    const [isFetchingModels, setIsFetchingModels] = useState<Record<string, boolean>>({});
    const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

    const testProvider = async (provider: ApiLLMProviderItem): Promise<{ success: boolean; message: string }> => {
        setIsTesting(prev => ({ ...prev, [provider.uid]: true }));

        try {
            const client = new OpenAI({
                apiKey: provider.apiKey,
                baseURL: provider.url,
                dangerouslyAllowBrowser: true,
            });

            // Test by listing models
            await client.models.list();

            const result = { success: true, message: "Connection successful" };
            setTestResults(prev => ({ ...prev, [provider.uid]: result }));
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Connection failed";
            const result = { success: false, message };
            setTestResults(prev => ({ ...prev, [provider.uid]: result }));
            return result;
        } finally {
            setIsTesting(prev => ({ ...prev, [provider.uid]: false }));
        }
    };

    const fetchModels = async (provider: ApiLLMProviderItem): Promise<Model[]> => {
        setIsFetchingModels(prev => ({ ...prev, [provider.uid]: true }));

        try {
            const client = new OpenAI({
                apiKey: provider.apiKey,
                baseURL: provider.url,
                dangerouslyAllowBrowser: true,
            });

            const response = await client.models.list();
            const models: Model[] = response.data.map(model => ({
                id: model.id,
                name: model.id,
            }));

            return models;
        } catch (error) {
            console.error("Failed to fetch models:", error);
            return [];
        } finally {
            setIsFetchingModels(prev => ({ ...prev, [provider.uid]: false }));
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
