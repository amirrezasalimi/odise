import type { TTSProvider } from "@odise/types";

export interface LoadedPlugins {
    tts: TTSProvider[]
}
export interface PluginInfo {
    type: "tts" | "embedding" | "llm"
    name: string
    id: string
    author: string
    authorUrl?: string
    version?: string
    description?: string
}
export abstract class Plugin {
    info?: PluginInfo
}