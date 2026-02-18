// Model variants configuration
export const MODEL_VARIANTS = [
    {
        id: "kokoro-82m",
        name: "Kokoro-82M",
        modelId: "onnx-community/Kokoro-82M-v1.0-ONNX",
        sizeMB: 82,
    },
    {
        id: "kokoro-82m-quantized",
        name: "Kokoro-82M Quantized",
        modelId: "onnx-community/Kokoro-82M-v1.0-ONNX-quantized",
        sizeMB: 40,
    },
] as const;

export type ModelVariantId = typeof MODEL_VARIANTS[number]["id"];

export function getVariantById(id: string) {
    return MODEL_VARIANTS.find((v) => v.id === id);
}
