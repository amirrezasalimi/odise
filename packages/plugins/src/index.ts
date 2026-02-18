import { TTSProvider } from "@odise/types";
import { Plugin, type LoadedPlugins } from "./types";

// todo
export async function loadCommunityPlugins(
    ids: string[],
): Promise<LoadedPlugins> {
    const result: LoadedPlugins = {
        tts: []
    }
    for (const id of ids) {
        const plugin = await import(id)
        if (plugin.default instanceof TTSProvider) {
            result.tts.push(new plugin.default())
        }
    }
    return result
}


export * from "./types"