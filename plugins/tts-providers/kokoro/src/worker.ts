import { KokoroTTS, TextSplitterStream } from "kokoro-js";
import { detectWebGPU } from "./utils";
import { getVariantById } from "./config";


// Worker context types
// @ts-expect-error - Worker global scope
declare const self: WorkerGlobalScope & typeof globalThis;

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
    voices?: Record<string, string>;
    variantId?: string;
    chunk?: {
        audio: Blob;
        text: string;
    };
    audio?: Blob | null;
    error?: string;
    progress?: number;
}

let tts: KokoroTTS | null = null;
let device: "webgpu" | "wasm" = "wasm";
let currentVariantId: string | undefined = undefined;

// Initialize the worker with a specific variant
async function initWorker(variantId: string = "kokoro-82m") {
    try {
        // Unload previous model if exists
        if (tts) {
            tts = null;
        }

        // Device detection
        device = (await detectWebGPU()) ? "webgpu" : "wasm";
        self.postMessage({ status: "device", device } satisfies WorkerResponse);

        // Get model configuration
        const variant = getVariantById(variantId);
        if (!variant) {
            throw new Error(`Unknown variant: ${variantId}`);
        }

        // Load the model with progress reporting
        tts = await KokoroTTS.from_pretrained(variant.modelId, {
            dtype: device === "wasm" ? "q8" : "fp32",
            device,
            progress_callback: (progressInfo: any) => {
                // Extract progress value from ProgressInfo object
                const progress = progressInfo?.progress ?? 0;
                self.postMessage({
                    status: "progress",
                    progress,
                } satisfies WorkerResponse);
            },
        });

        currentVariantId = variantId;

        self.postMessage({
            status: "ready",
            voices: tts.voices,
            device,
            variantId: currentVariantId,
        } satisfies WorkerResponse);
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        self.postMessage({ status: "error", error } satisfies WorkerResponse);
        throw e;
    }
}

// Unload the current model
async function unloadWorker() {
    tts = null;
    currentVariantId = undefined;
    // Don't post "ready" message on unload - the main thread will terminate the worker
}

// Process TTS generation

async function processSpeak(text: string, voice: string, speed: number = 1, stream = false) {
    if (!tts) throw new Error("TTS model not initialized");

    if (!stream) {
        const audio = await tts.generate(text, { voice: voice as any, speed });
        self.postMessage({ status: "complete", audio: audio.toBlob() } satisfies WorkerResponse);
        return;
    }

    const streamer = new TextSplitterStream();
    streamer.push(text);
    streamer.close();

    for await (const { text: chunkText, audio } of tts.stream(streamer, { voice: voice as any, speed })) {
        self.postMessage({
            status: "stream",
            chunk: { audio: audio.toBlob(), text: chunkText },
        } satisfies WorkerResponse);
    }
    self.postMessage({ status: "complete" } satisfies WorkerResponse);
}


// Listen for messages from the main thread
self.addEventListener("message", async (e: MessageEvent<WorkerMessage>) => {
    const { type, variantId, text, voice, speed, stream } = e.data;

    switch (type) {
        case "init":
            await initWorker(variantId);
            break;
        case "speak":
            if (text && voice) {
                await processSpeak(text, voice, speed, stream);
            }
            break;
        case "unload":
            await unloadWorker();
            break;
    }
});
