import KokoroTTSProvider from '@odise/kokoro-tts'
import OpenAITTSProvider from '@odise/openai-tts'
import TransformersEmbeddingProvider from '@odise/transformers-embedding'
import OpenAIEmbeddingProvider from '@odise/openai-embedding'
import KittenTTSProvider from '@odise/kitten-tts'
import type { TTSProvider, EmbeddingProvider } from '@odise/types'

// Type for provider class constructors that can be instantiated
export type ProviderClass = new (...args: any[]) => TTSProvider | EmbeddingProvider;

export const plugins_registry: ProviderClass[] = [
    // tts
    KokoroTTSProvider,
    OpenAITTSProvider,
    KittenTTSProvider,
    // embedding
    TransformersEmbeddingProvider,
    OpenAIEmbeddingProvider
]

export const DEFAULT_EMBEDDING_MODELS = [
    {
        id: "granite-30m",
        name: "Granite Embedding 30M",
        modelId: "onnx-community/granite-embedding-30m-english-ONNX",
        dimension: 384,
        pluginId: "transformers-embedding",
    },
];


export const DEFAULT_API_TTS_ID = "openai-tts";

export const DEFAULT_API_EMBEDDING_ID = "openai";

export const DEFAULT_API_LLM_ID = "openai";