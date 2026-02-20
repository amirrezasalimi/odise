export interface EmbeddingProviderType {
    id: string;
    name: string;
    defaultUrl: string;
    pluginId?: string
}

export const EMBEDDING_PROVIDER_TYPES: EmbeddingProviderType[] = [
    {
        id: "openai",
        name: "OpenAI",
        defaultUrl: "https://api.openai.com/v1",
    },
    {
        id: "ollama",
        name: "Ollama",
        defaultUrl: "http://localhost:11434/v1",
    },
    {
        id: "openai-compatible",
        name: "OpenAI Compatible",
        defaultUrl: "https://api.example.com/v1",
    },
];
