import { pipeline, env, type FeatureExtractionPipeline } from "@huggingface/transformers";
import type { WorkerMessage, WorkerResponse } from "./types";

// Skip local check to allow loading from HF Hub
env.allowLocalModels = false;
env.useBrowserCache = true;

// Worker context types
// @ts-expect-error - Worker global scope
declare const self: WorkerGlobalScope & typeof globalThis;

let extractor: FeatureExtractionPipeline | null = null;
let currentModel: string | null = null;

async function initWorker(model: string, runtime: "webgpu" | "wasm", quantization: string) {
    try {
        if (extractor && currentModel === model) {
            self.postMessage({ status: "ready", device: runtime } satisfies WorkerResponse);
            return;
        }

        extractor = null;

        extractor = await pipeline("feature-extraction", model, {
            device: runtime,
            dtype: quantization === "fp32" ? "fp32" : quantization === "fp16" ? "fp16" : quantization === "int8" ? "q8" : quantization === "int4" ? "q4" : "fp32",
            progress_callback: (progressInfo: any) => {
                const progress = progressInfo?.progress ?? 0;
                self.postMessage({
                    status: "progress",
                    progress,
                } satisfies WorkerResponse);
            },
        });

        currentModel = model;
        self.postMessage({ status: "ready", device: runtime } satisfies WorkerResponse);
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        self.postMessage({ status: "error", error } satisfies WorkerResponse);
    }
}

async function processEmbed(text: string) {
    if (!extractor) {
        throw new Error("Extractor not initialized");
    }

    try {
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        const embedding = Array.from(output.data as Float32Array);
        self.postMessage({ status: "embedding", embedding } satisfies WorkerResponse);
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        self.postMessage({ status: "error", error } satisfies WorkerResponse);
    }
}

self.addEventListener("message", async (e: MessageEvent<WorkerMessage>) => {
    const { type, model, runtime, quantization, text } = e.data;

    switch (type) {
        case "init":
            if (model && runtime && quantization) {
                await initWorker(model, runtime, quantization);
            }
            break;
        case "embed":
            if (text) {
                await processEmbed(text);
            }
            break;
        case "unload":
            extractor = null;
            currentModel = null;
            break;
    }
});
