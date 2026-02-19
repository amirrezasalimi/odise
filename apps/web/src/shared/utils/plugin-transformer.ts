import type { TTSProvider } from "@odise/types";

export interface ProviderItem {
    id: string; // The specific instance ID (nanoid)
    pluginId: string; // The plugin type ID (e.g. "elevenlabs")
    apiKey: string;
    url: string;
    enabled: boolean;
}

export interface PluginClass {
    new(...args: any[]): TTSProvider;
}

/**
 * Transforms non-local provider configs into plugin instances.
 */
export const transformNonLocalConfigsToInstances = (
    pluginRegistry: PluginClass[],
    providerConfigs: ProviderItem[]
): TTSProvider[] => {
    const instances: TTSProvider[] = [];

    providerConfigs.forEach((providerConfig) => {
        if (!providerConfig.enabled) return;

        const PluginClass = pluginRegistry.find((p: PluginClass) => {
            const temp = new p();
            return (temp as any).info?.id === providerConfig.pluginId;
        });

        if (!PluginClass) return;

        const instance = new PluginClass() as any;
        if (instance.setConfig) {
            instance.setConfig({
                apiKey: providerConfig.apiKey,
                url: providerConfig.url,
            });
        }
        // Attach the instance ID and plugin ID to the instance for later reference if needed
        instance.instanceId = providerConfig.id;
        instances.push(instance);
    });

    return instances;
};
