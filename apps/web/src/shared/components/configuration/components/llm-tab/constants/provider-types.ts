export interface LLMProviderType {
    id: string;
    name: string;
    defaultUrl: string;
    pluginId?: string
}

export const LLM_PROVIDER_TYPES: LLMProviderType[] = [
    {
        id: "openai",
        name: "OpenAI",
        defaultUrl: "https://api.openai.com/v1",
    },
    {
        id: "openrouter",
        name: "OpenRouter",
        defaultUrl: "https://openrouter.ai/api/v1",
    },
    {
        id: "ollama",
        name: "Ollama",
        defaultUrl: "http://localhost:11434/v1",
    },
    {
        id: "lmstudio",
        name: "LM Studio",
        defaultUrl: "http://localhost:1234/v1",
    },
    {
        id: "anthropic",
        name: "Anthropic",
        defaultUrl: "https://api.anthropic.com/v1",
    },
    {
        id: "google",
        name: "Google AI",
        defaultUrl: "https://generativelanguage.googleapis.com/v1beta",
    },
    {
        id: "cohere",
        name: "Cohere",
        defaultUrl: "https://api.cohere.ai/v1",
    },
    {
        id: "openai-compatible",
        name: "OpenAI Compatible",
        defaultUrl: "https://api.example.com/v1",
    },
];
