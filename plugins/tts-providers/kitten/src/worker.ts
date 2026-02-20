import { KittenTTSBrowser } from "./tts";
import { encodeWAV } from "./utils";

// Worker context types
/// <reference lib="webworker" />
declare const self: DedicatedWorkerGlobalScope & typeof globalThis;

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
    voices?: Record<string, any>;
    variantId?: string;
    chunk?: {
        audio: Blob;
        text: string;
    };
    audio?: Blob | null;
    error?: string;
    progress?: number;
}

let tts: KittenTTSBrowser | null = null;
let currentVariantId: string | undefined = undefined;

async function initWorker(variantId: string = "nano-int8-15M") {
    try {
        if (tts) {
            tts = null; // Unload previous model
        }

        self.postMessage({ status: "device", device: "wasm" } satisfies WorkerResponse);

        tts = new KittenTTSBrowser();

        await tts.loadModel(variantId, self.location.origin + "/kittenTTS-voices", (progress: number) => {
            self.postMessage({
                status: "progress",
                progress,
            } satisfies WorkerResponse);
        });

        currentVariantId = variantId;

        // Build simple voice list from the loaded voices
        const voiceKeys = Object.keys(tts.voices || {});
        const aliasKeys = Object.keys(tts.voiceAliases || {});
        const allVoiceIds = Array.from(new Set([...voiceKeys, ...aliasKeys]));

        const voicesData = allVoiceIds.reduce((acc, key) => {
            acc[key] = { name: key, lang: "en", gender: "unknown" };
            return acc;
        }, {} as Record<string, any>);

        self.postMessage({
            status: "ready",
            voices: voicesData,
            device: "wasm",
            variantId: currentVariantId,
        } satisfies WorkerResponse);
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        self.postMessage({ status: "error", error } satisfies WorkerResponse);
        throw e;
    }
}

async function unloadWorker() {
    tts = null;
    currentVariantId = undefined;
}

async function processSpeak(text: string, voice: string, speed: number = 1, stream = false) {
    if (!tts) throw new Error("TTS model not initialized");

    try {
        const audioBuffer = await tts.generate(text, voice, speed);
        const wavBlob = encodeWAV(audioBuffer);

        if (stream) {
            self.postMessage({
                status: "stream",
                chunk: { audio: wavBlob, text },
            } satisfies WorkerResponse);
        }

        self.postMessage({ status: "complete", audio: wavBlob } satisfies WorkerResponse);
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        self.postMessage({ status: "error", error } satisfies WorkerResponse);
    }
}

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
