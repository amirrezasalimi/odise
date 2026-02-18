import { TTSProvider, type SpeakOptions, type TTSOptions, type TTSProviderSpeaker, type TTSSpeakResult } from "@odise/types";

export default class PocketTTSProvider extends TTSProvider {
    options?: TTSOptions = {
        id: "pocket-tts",
        author: "pocket-tts",
        name: "Pocket TTS",
        version: "1.0.0",
        description: "Pocket TTS",
        supportVoiceCloning: true
    }
    async speak(options: SpeakOptions): Promise<TTSSpeakResult> {
        throw new Error("Method not implemented.");
    }

    async getSpeakers(): Promise<TTSProviderSpeaker[]> {
        return [{
            name: "kokoro",
            id: "kokoro",
            isDefault: true,
            lang: "en"
        }]
    }
}