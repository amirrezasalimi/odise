export interface TTSProviderItem {
    id: string;
    name: string;
    url: string;
    apiKey: string;
    enabled: boolean;
    selectedModelId?: string;
    customSpeakers: string[];
    pluginId: string
}

export interface TTSProvidersConfig {
    providers: TTSProviderItem[];
}
// llm

export interface LLMProviderItem {
    id: string;
    name: string;
    url?: string;
    apiKey?: string;
    enabled: boolean;
    selectedModelId?: string;
    models?: {
        name: string
        id: string
    }[]
    pluginId: string
}

export interface LLMProvidersConfig {
    providers: LLMProviderItem[];
}

// embedding

export interface EmbeddingProviderItem {
    id: string
    name: string;
    url?: string;
    apiKey?: string;
    enabled: boolean;
    selectedModelId?: string;
    models?: {
        name: string
        id: string
    }[]
    pluginId: string
}

export interface EmbeddingProvidersConfig {
    providers: LLMProviderItem[];
}