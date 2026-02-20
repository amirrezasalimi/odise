export interface TransformersEmbeddingConfig {
    runtime: "webgpu" | "wasm";
    model: string; // username/repo
    quantization: "fp16" | "int8" | "int4" | "fp32";
}

export interface WorkerMessage {
    type: "init" | "embed" | "unload";
    model?: string;
    runtime?: "webgpu" | "wasm";
    quantization?: string;
    text?: string;
}

export interface WorkerResponse {
    status: "ready" | "embedding" | "error" | "progress" | "device";
    device?: string;
    embedding?: number[];
    error?: string;
    progress?: number;
}
