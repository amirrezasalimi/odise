import OpenAI from "openai";
import {
    TTSProvider,
    type SpeakOptions,
    type TTSOptions,
    type TTSProviderSpeaker,
    type TTSSpeakResult,
    type TTSProviderConfig,
    type TTSProviderVariant,
} from "@odise/types";
import type { PluginInfo } from "@odise/plugins";

export default class OpenAITTSProvider extends TTSProvider {
    info: PluginInfo = {
        id: "openai-tts",
        name: "OpenAI TTS",
        author: "OpenAI",
        authorUrl: "https://openai.com",
        version: "1.0.0",
        description:
            "OpenAI's text-to-speech API provides high-quality, natural-sounding voices in multiple languages. Supports multiple voice models including the latest TTS-1 and TTS-1-HD models.",
    };

    options: TTSOptions = {
        supportedLanguages: ["en", "es", "fr", "de", "it", "pt", "nl", "pl", "ru", "ja", "ko", "zh", "ar", "hi", "tr", "sv", "da", "no", "fi", "cs", "ro", "uk", "el", "he", "id", "ms", "th", "vi", "bn", "ta", "te", "mr", "ur"],
        supportVoiceCloning: false,
        supportVoiceDesign: false,
        supportChunking: false,
        isLocal: false,
        hasVariants: true,
        defaultVariant: "tts-1",
    };

    private config: TTSProviderConfig;
    private client: OpenAI | null = null;
    private speakers: TTSProviderSpeaker[] = [
        { id: "alloy", name: "Alloy", lang: "en" },
        { id: "echo", name: "Echo", lang: "en" },
        { id: "fable", name: "Fable", lang: "en" },
        { id: "fable", name: "Fable", lang: "en" },
        { id: "onyx", name: "Onyx", lang: "en" },
        { id: "nova", name: "Nova", lang: "en" },
        { id: "shimmer", name: "Shimmer", lang: "en" },
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
            dangerouslyAllowBrowser: true
        });
    }

    setConfig(config: TTSProviderConfig): void {
        this.config = config;
        this.initializeClient();
    }

    getApiUrl(): string {
        return this.config.url;
    }

    async getSpeakers(): Promise<TTSProviderSpeaker[]> {
        return this.speakers;
    }

    async loadVariants(): Promise<TTSProviderVariant[]> {
        if (!this.client) {
            throw new Error("OpenAI API key is not configured. Please set the config using setConfig().");
        }

        try {
            const models = await this.client.models.list();
            console.log("models", models);

            const ttsModels = models.data
                .map(model => ({
                    id: model.id,
                    name: model.id.toUpperCase().replace("-", " "),
                    sizeMB: 0,
                    loaded: true,
                }));

            return ttsModels;
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to load TTS models"
            );
        }
    }

    async speak(options: SpeakOptions): Promise<TTSSpeakResult> {
        if (!this.client) {
            throw new Error("OpenAI API key is not configured. Please set the config using setConfig().");
        }

        try {
            const response = await this.client.audio.speech.create({
                model: options.variantId ?? this.options.defaultVariant ?? "tts-1",
                input: options.text,
                voice: options.speakerId,
                response_format: "mp3",
                speed: options.speed ?? 1.0,
            });

            const audioBlob = new Blob([await response.arrayBuffer()], { type: "audio/mpeg" });

            return {
                result: {
                    audio: audioBlob,
                },
            };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to generate speech"
            );
        }
    }
}
