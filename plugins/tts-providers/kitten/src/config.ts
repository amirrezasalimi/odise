// Model variants configuration
export const MODEL_VARIANTS = [
    {
        id: "nano-int8-15M",
        name: "Nano INT8 (15M)",
        sizeMB: 15,
    },
    {
        id: "nano-15M",
        name: "Nano (15M)",
        sizeMB: 15,
    },
    {
        id: "micro-40M",
        name: "Micro (40M)",
        sizeMB: 40,
    },
    {
        id: "mini-80M",
        name: "Mini (80M)",
        sizeMB: 80,
    },
] as const;

export type ModelVariantId = typeof MODEL_VARIANTS[number]["id"];

export function getVariantById(id: string) {
    return MODEL_VARIANTS.find((v) => v.id === id);
}
