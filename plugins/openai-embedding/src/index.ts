import OpenAI from "openai";
import {
    EmbeddingProvider,
    type EmbeddingResult,
    type EmbeddingOptions,
    type EmbeddingProviderConfig,
    type EmbeddingProviderVariant,
} from "@odise/types";
import type { PluginInfo } from "@odise/plugins";

export default class OpenAIEmbeddingProvider extends EmbeddingProvider<EmbeddingProviderConfig> {
    info: PluginInfo = {
        type: "embedding",
        id: "openai-embedding",
        name: "OpenAI Embeddings",
        author: "OpenAI",
        authorUrl: "https://openai.com",
        version: "1.0.0",
        description:
            "OpenAI's text embedding API provides high-quality embeddings for semantic search, clustering, and similarity matching. Supports multiple models including text-embedding-3-small and text-embedding-3-large.",
    };

    options: EmbeddingOptions = {
        isLocal: false,
        dimension: 1536,
        hasVariants: true,
        defaultVariantId: "text-embedding-3-small",
    };

    private config: EmbeddingProviderConfig;
    private client: OpenAI | null = null;
    private variants: EmbeddingProviderVariant[] = [
        {
            id: "text-embedding-3-small",
            name: "text-embedding-3-small",
            sizeMB: 0,
            loaded: true,
        },
        {
            id: "text-embedding-3-large",
            name: "text-embedding-3-large",
            sizeMB: 0,
            loaded: true,
        },
        {
            id: "text-embedding-ada-002",
            name: "text-embedding-ada-002",
            sizeMB: 0,
            loaded: true,
        },
    ];

    constructor(endpoint?: string, apiKey?: string) {
        super();
        this.config = {
            url: endpoint || "https://api.openai.com",
            apiKey: apiKey || "",
        };
        if (apiKey) {
            this.initializeClient();
        }
    }

    private initializeClient(): void {
        if (!this.config.apiKey) {
            this.client = null;
            return;
        }
        this.client = new OpenAI({
            apiKey: this.config.apiKey,
            baseURL: this.config.url,
            dangerouslyAllowBrowser: true,
        });
    }

    setConfig(config: EmbeddingProviderConfig): void {
        this.config = config;
        this.initializeClient();
    }

    async embed(text: string): Promise<EmbeddingResult> {
        if (!this.client) {
            throw new Error("OpenAI client not initialized. Please provide an API key.");
        }

        const model = this.selectedVariantId || this.options.defaultVariantId || "text-embedding-3-small";

        const response = await this.client.embeddings.create({
            model,
            input: text,
        });

        const embedding = response.data[0]?.embedding;
        if (!embedding) {
            throw new Error("Failed to get embedding from OpenAI API");
        }

        return { embedding };
    }

    async loadVariants(): Promise<EmbeddingProviderVariant[]> {
        return this.variants;
    }

    getApiUrl(): string {
        return this.config.url || "https://api.openai.com";
    }
}
