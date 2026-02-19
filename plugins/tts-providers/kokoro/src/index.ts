import {
    TTSProvider,
    type SpeakOptions,
    type TTSOptions,
    type TTSProviderSpeaker,
    type TTSSpeakResult,
    type TTSProviderVariant,
} from "@odise/types";
import { MODEL_VARIANTS } from "./config";
import type { PluginInfo } from "@odise/plugins";
import type { SpeakerInfo } from "./types";

interface WorkerMessage {
    type: "init" | "speak" | "unload";
    variantId?: string;
    text?: string;
    voice?: string;
    speed?: number;
    stream?: boolean;
}

interface WorkerResponse {
    status: "device" | "ready" | "stream" | "complete" | "error" | "progress";
    device?: string;
    voices?: Record<string, SpeakerInfo>;
    variantId?: string;
    chunk?: {
        audio: Blob;
        text: string;
    };
    audio?: Blob;
    error?: string;
    progress?: number;
}

export default class KokoroTTSProvider extends TTSProvider {
    info: PluginInfo = {
        id: "kokoro-tts",
        name: "Kokoro TTS",
        author: "hexgrad",
        authorUrl: "https://github.com/hexgrad/kokoro",
        version: "1.0.0",
        description:
            "Kokoro is an open-weight TTS model with 82 million parameters. Despite its lightweight architecture, it delivers comparable quality to larger models while being significantly faster and more cost-efficient.",
    }
    options: TTSOptions = {
        supportedLanguages: ["en", "ja"],
        supportVoiceCloning: false,
        supportVoiceDesign: false,
        supportChunking: false,
        defaultSpeakerId: "af_heart",
        defaultVariant: "kokoro-82m",
        hasVariants: true,
        isLocal: true,
    };

    private worker: Worker | null = null;
    private speakers: TTSProviderSpeaker[] = [];
    private isReady = false;
    private voices: Record<string, SpeakerInfo> = {};
    private currentVariantId: string | undefined = undefined;
    private device: "webgpu" | "wasm" = "wasm";

    async getSpeakers(): Promise<TTSProviderSpeaker[]> {
        return this.speakers;
    }

    async speak(options: SpeakOptions): Promise<TTSSpeakResult> {
        if (!this.isReady) {
            return { needLoad: true };
        }

        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error("Worker not initialized"));
                return;
            }

            const chunks: {
                start?: number;
                end?: number;
                text: string;
                audio: Blob;
            }[] = [];
            let completeAudio: Blob | null = null;
            let hasError = false;

            const handleMessage = (event: MessageEvent<WorkerResponse>) => {
                const { status, chunk, audio, error } = event.data;

                switch (status) {
                    case "stream":
                        if (chunk) {
                            chunks.push({
                                text: chunk.text,
                                audio: chunk.audio,
                            });
                        }
                        break;
                    case "complete":
                        completeAudio = audio ?? null;
                        cleanup();
                        resolve({
                            result: {
                                audio: completeAudio ?? undefined,
                                chunks: chunks.length > 0 ? chunks : undefined,
                            },
                        });
                        break;
                    case "error":
                        hasError = true;
                        cleanup();
                        reject(new Error(error || "Unknown error"));
                        break;
                }
            };

            const handleError = (error: ErrorEvent) => {
                hasError = true;
                cleanup();
                reject(new Error(error.message || "Worker error"));
            };

            const cleanup = () => {
                if (this.worker) {
                    this.worker.removeEventListener("message", handleMessage);
                    this.worker.removeEventListener("error", handleError);
                }
            };

            this.worker.addEventListener("message", handleMessage);
            this.worker.addEventListener("error", handleError);

            // Send speak request
            this.worker.postMessage({
                type: "speak",
                text: options.text,
                voice: options.speakerId,
                speed: options.speed ?? 1,
                stream: options?.stream ?? false,
            } satisfies WorkerMessage);
        });
    }

    async loadVariants(): Promise<TTSProviderVariant[]> {
        return MODEL_VARIANTS.map((variant) => ({
            id: variant.id,
            name: variant.name,
            sizeMB: variant.sizeMB,
            loaded: this.currentVariantId === variant.id,
        }));
    }

    async load(variantId?: string, onProgress?: (progress: number) => void): Promise<void> {
        const targetVariantId = variantId ?? "kokoro-82m";
        await this.initializeWorker(targetVariantId, onProgress);
    }

    async unload(): Promise<void> {
        if (this.worker) {
            this.worker.postMessage({
                type: "unload",
            } satisfies WorkerMessage);
            this.worker.terminate();
            this.worker = null;
        }
        this.isReady = false;
        this.speakers = [];
        this.currentVariantId = undefined;
    }

    private async initializeWorker(
        variantId: string = "kokoro-82m",
        onProgress?: (progress: number) => void,
    ): Promise<void> {
        // Return early if already initialized with the same variant
        if (this.isReady && this.currentVariantId === variantId) {
            return;
        }

        // Terminate existing worker if variant changed or worker exists
        if (this.worker) {
            // Send unload message to worker before terminating
            try {
                this.worker.postMessage({
                    type: "unload",
                } satisfies WorkerMessage);
            } catch (e) {
                // Worker may already be terminated, ignore error
            }
            this.worker.terminate();
            this.worker = null;
            this.isReady = false;
            this.speakers = [];
        }

        return new Promise((resolve, reject) => {
            try {
                this.worker = new Worker(
                    new URL("./worker.ts", import.meta.url),
                    { type: "module" },
                );

                const handleMessage = (event: MessageEvent<WorkerResponse>) => {
                    const { status, device, voices, error, progress } = event.data;

                    switch (status) {
                        case "device":
                            this.device =
                                device === "webgpu" || device === "wasm" ? device : "wasm";
                            break;
                        case "progress":
                            if (typeof progress === "number" && onProgress) {
                                onProgress(progress);
                            }
                            break;
                        case "ready":
                            this.voices = voices ?? {};
                            this.currentVariantId = variantId;

                            this.speakers = Object.entries(this.voices).map(
                                ([id, data]: [string, SpeakerInfo]) => ({
                                    id,
                                    name: data.name,
                                    lang: data.language,
                                    gender: data.gender,
                                }),
                            );

                            this.isReady = true;
                            cleanup();
                            resolve();
                            break;
                        case "error":
                            cleanup();
                            reject(new Error(error || "Failed to initialize worker"));
                            break;
                    }
                };

                const handleError = (error: ErrorEvent) => {
                    cleanup();
                    reject(new Error(error.message || "Worker initialization error"));
                };

                const cleanup = () => {
                    if (this.worker) {
                        this.worker.removeEventListener("message", handleMessage);
                        this.worker.removeEventListener("error", handleError);
                    }
                };

                this.worker.addEventListener("message", handleMessage);
                this.worker.addEventListener("error", handleError);

                // Initialize the worker with variant
                this.worker.postMessage({
                    type: "init",
                    variantId,
                } satisfies WorkerMessage);
            } catch (error) {
                reject(
                    new Error(
                        error instanceof Error ? error.message : "Failed to create worker",
                    ),
                );
            }
        });
    }
}
