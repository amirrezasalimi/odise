export interface ApiTTSProviderItem {
    id: string;
    name: string;
    url: string;
    apiKey: string;
    enabled: boolean;
    selectedModelId?: string;
    customSpeakers: string[];
    uid: string
}

export interface ApiTTSProvidersConfig {
    providers: ApiTTSProviderItem[];
}

export interface ApiLLMProviderItem {
    id: string;
    name: string;
    url: string;
    apiKey: string;
    enabled: boolean;
    selectedModelId?: string;
    uid: string
    models?: {
        name: string
        id: string
    }[]
}

export interface ApiLLMProvidersConfig {
    providers: ApiLLMProviderItem[];
}