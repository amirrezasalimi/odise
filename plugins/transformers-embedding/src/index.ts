import {
    EmbeddingProvider,
    type EmbeddingResult,
    type EmbeddingOptions,
} from "@odise/types";
import type { PluginInfo } from "@odise/plugins";
import type {
    TransformersEmbeddingConfig,
    WorkerMessage,
    WorkerResponse
} from "./types";

export default class TransformersEmbeddingProvider extends EmbeddingProvider<TransformersEmbeddingConfig> {
    info: PluginInfo = {
        type: "embedding",
        id: "transformers-embedding",
        name: "Local Transformers",
        author: "Odise",
        version: "1.0.0",
        description: "Run optimized embedding models locally using Transformer.js and ONNX runtime.",
    }

    options: EmbeddingOptions = {
        isLocal: true,
        dimension: 384,
        hasVariants: false,
    };

    private config: TransformersEmbeddingConfig | null = null;
    private worker: Worker | null = null;
    private isReady = false;

    setConfig(config: TransformersEmbeddingConfig): void {
        this.config = config;
    }

    async embed(text: string): Promise<EmbeddingResult> {
        if (!this.isReady || !this.worker) {
            throw new Error("Embedding model not loaded");
        }

        return new Promise((resolve, reject) => {
            const handleMessage = (event: MessageEvent<WorkerResponse>) => {
                const { status, embedding, error } = event.data;
                if (status === "embedding" && embedding) {
                    cleanup();
                    resolve({ embedding });
                } else if (status === "error") {
                    cleanup();
                    reject(new Error(error || "Embedding failed"));
                }
            };

            const handleError = (error: ErrorEvent) => {
                cleanup();
                reject(new Error(error.message || "Worker error"));
            };

            const cleanup = () => {
                this.worker?.removeEventListener("message", handleMessage);
                this.worker?.removeEventListener("error", handleError);
            };

            this.worker?.addEventListener("message", handleMessage);
            this.worker?.addEventListener("error", handleError);

            this.worker?.postMessage({
                type: "embed",
                text,
            } satisfies WorkerMessage);
        });
    }

    async load(_variantId?: string, onProgress?: (progress: number) => void): Promise<void> {
        if (!this.config) {
            throw new Error("Configuration not set. Local model needs a model ID.");
        }

        if (this.isReady) return;

        const config = this.config;

        return new Promise((resolve, reject) => {
            try {
                if (this.worker) {
                    this.worker.terminate();
                }

                this.worker = new Worker(
                    new URL("./worker.ts", import.meta.url),
                    { type: "module" }
                );

                const handleMessage = (event: MessageEvent<WorkerResponse>) => {
                    const { status, progress, error } = event.data;

                    switch (status) {
                        case "progress":
                            if (typeof progress === "number" && onProgress) {
                                onProgress(progress);
                            }
                            break;
                        case "ready":
                            this.isReady = true;
                            cleanup();
                            resolve();
                            break;
                        case "error":
                            cleanup();
                            reject(new Error(error || "Worker initialization failed"));
                            break;
                    }
                };

                const handleError = (error: ErrorEvent) => {
                    cleanup();
                    reject(new Error(error.message || "Worker error"));
                };

                const cleanup = () => {
                    this.worker?.removeEventListener("message", handleMessage);
                    this.worker?.removeEventListener("error", handleError);
                };

                this.worker.addEventListener("message", handleMessage);
                this.worker.addEventListener("error", handleError);

                this.worker.postMessage({
                    type: "init",
                    model: config.model,
                    runtime: config.runtime || "wasm",
                    quantization: config.quantization || "fp32",
                } satisfies WorkerMessage);
            } catch (error) {
                reject(error);
            }
        });
    }

    async unload(): Promise<void> {
        if (this.worker) {
            this.worker.postMessage({ type: "unload" } satisfies WorkerMessage);
            this.worker.terminate();
            this.worker = null;
        }
        this.isReady = false;
    }
}



