import KokoroTTSProvider from '@odise/kokoro-tts'
import OpenAITTSProvider from '@odise/openai-tts'
import type { TTSProvider } from '@odise/types'

// Type for TTS provider class constructors that can be instantiated
export type TTSProviderClass = new (...args: any[]) => TTSProvider;

export const plugins_registry: TTSProviderClass[] = [
    // tts  
    KokoroTTSProvider,
    OpenAITTSProvider
]
