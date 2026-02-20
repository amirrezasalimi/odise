import { Plugin } from "@odise/plugins"

export interface EmbeddingOptions {
    isLocal?: boolean
    dimension?: number
    defaultVariantId?: string
    hasVariants?: boolean
}

export interface EmbeddingResult {
    embedding: number[]
}

export interface EmbeddingProviderVariant {
    id: string
    name: string
    sizeMB: number
    loaded: boolean
}

export interface EmbeddingProviderConfig {
    apiKey?: string;
    url?: string;
}

export abstract class EmbeddingProvider<C = any> extends Plugin {
    abstract options?: EmbeddingOptions;
    abstract embed(text: string): Promise<EmbeddingResult>;

    // for local models
    loadVariants?(): Promise<EmbeddingProviderVariant[]>;
    load?(variantId?: string, onProgress?: (progress: number) => void): Promise<void>;
    unload?(): Promise<void>;

    // for API providers
    setConfig?(config: C): void;
}

