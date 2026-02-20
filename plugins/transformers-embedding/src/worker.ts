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

        // Map quantization to Transformers.js dtypes
        let dtype: any = "fp32";
        if (quantization === "fp16") dtype = "fp16";
        else if (quantization === "int8") dtype = "q8";
        else if (quantization === "int4") dtype = "q4";

        const fileProgress = new Map<string, number>();

        extractor = await pipeline("feature-extraction", model, {
            device: runtime,
            dtype: dtype,
            progress_callback: (progressInfo: any) => {
                if (progressInfo.status === 'progress') {
                    fileProgress.set(progressInfo.file, progressInfo.progress);

                    // Multi-file progress aggregation
                    let total = 0;
                    fileProgress.forEach(p => total += p);
                    const avgProgress = total / fileProgress.size;

                    self.postMessage({
                        status: "progress",
                        progress: avgProgress,
                    } satisfies WorkerResponse);
                } else if (progressInfo.status === 'done') {
                    fileProgress.set(progressInfo.file, 100);
                }
            },
        });

        currentModel = model;
        self.postMessage({ status: "ready", device: runtime } satisfies WorkerResponse);
    } catch (e) {
        extractor = null;
        currentModel = null;
        const error = e instanceof Error ? e.message : String(e);
        console.error("Worker Init Error Details:", e);
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
