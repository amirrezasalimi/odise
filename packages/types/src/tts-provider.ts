import { Plugin } from "@odise/plugins"

export interface TTSOptions {
    supportedLanguages?: string[]
    supportVoiceCloning?: boolean
    supportVoiceDesign?: boolean
    supportChunking?: boolean
    defaultSpeakerId?: string
    // 
    isLocal?: boolean
    defaultVariant?: string
    hasVariants?: boolean
}
export interface TTSProviderSpeaker {
    name: string
    id: string
    lang?: string
    gender?: string
}
export interface TTSSpeakResult {
    result?: {
        audio?: Blob
        chunks?: {
            start?: number // seconds
            end?: number // seconds
            text: string
            audio: Blob
        }[]
    }
    needLoad?: boolean
}

export interface SpeakOptions {
    text: string
    speed?: number
    speakerId: string
    variantId?: string
}

export interface TTSProviderVariant {
    id: string
    name: string
    sizeMB: number
    loaded: boolean
}

export interface TTSProviderConfig {
    apiKey: string;
    url: string;
}

export abstract class TTSProvider extends Plugin {
    abstract options?: TTSOptions;

    abstract getSpeakers(): Promise<TTSProviderSpeaker[]>;
    abstract speak(options: SpeakOptions): Promise<TTSSpeakResult>;
    cloneVoice?(text: string, voice: Blob): Promise<TTSSpeakResult>;

    // for embeded models
    loadVariants?(): Promise<TTSProviderVariant[]>;
    load?(variantId?: string, onProgress?: (progress: number) => void): Promise<void>;
    unload?(): Promise<void>;

    // for API providers - set configuration (API key, URL, etc.)
    setConfig?(config: TTSProviderConfig): void;
}