import type { TTSProvider } from "@odise/types";

export interface ProviderConfig {
    apiKey: string;
    url: string;
}

export interface ProviderItem {
    id: string;
    apiKey: string;
    url: string;
    enabled: boolean;
}

export interface PluginClass {
    new(...args: any[]): TTSProvider;
}

/**
 * Transforms non-local provider configs into plugin instances.
 * Finds plugins based on registry id and matches with config row id.
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
            return (temp as any).info?.id === providerConfig.id;
        });

        if (!PluginClass) return;

        const instance = new PluginClass() as any;
        if (instance.setConfig) {
            instance.setConfig({
                apiKey: providerConfig.apiKey,
                url: providerConfig.url,
            });
        }
        instances.push(instance);
    });

    return instances;
};
