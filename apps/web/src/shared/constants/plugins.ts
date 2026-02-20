import KokoroTTSProvider from '@odise/kokoro-tts'
import OpenAITTSProvider from '@odise/openai-tts'
import SimpleEmbeddingProvider from '@odise/transformers-embedding'
import type { TTSProvider, EmbeddingProvider } from '@odise/types'

// Type for provider class constructors that can be instantiated
export type ProviderClass = new (...args: any[]) => TTSProvider | EmbeddingProvider;

export const plugins_registry: ProviderClass[] = [
    // tts  
    KokoroTTSProvider,
    OpenAITTSProvider,
    // embedding
    SimpleEmbeddingProvider
]
