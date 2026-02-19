import React, { useMemo, useState } from "react";
import { useTTSConfig } from "./hooks/use-tts-config";
import { useLocalTTS } from "./hooks/use-local-tts";
import { useProviderData } from "./hooks/use-provider-data";
import { useProviderTest } from "./hooks/use-provider-test";
import { plugins_registry } from "@/shared/constants/plugins";
import { Button, Spinner } from "@heroui/react";
import CustomSpeakersModal from "./components/custom-speakers-modal";
import type { TTSProvider } from "@odise/types";
import type { ApiTTSProviderItem } from "@/shared/types/config";
import TTSItem from "./components/tts-item";
import AddProviderModal from "./components/add-provider-modal";

const TTSTab = () => {
    const { providers, isLoading, addProvider, updateProvider, deleteProvider } = useTTSConfig();
    const { localTTS, isLoading: isLocalLoading, loadingProgress, loadLocal, unloadLocal } = useLocalTTS();
    const { variants, speakers, isLoading: dataLoading, loadVariants, loadSpeakers } = useProviderData();
    const { isTesting, testSpeaker } = useProviderTest();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<ApiTTSProviderItem | null>(null);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [customSpeakersText, setCustomSpeakersText] = useState("");

    // Group registry
    const localPluginTypes = useMemo(() =>
        plugins_registry.filter(p => (new p() as any).options?.isLocal), []);

    const localPluginIds = useMemo(() =>
        localPluginTypes.map(p => (new p() as any).info.id), [localPluginTypes]);

    const apiPluginTypes = useMemo(() =>
        plugins_registry.filter(p => !(new p() as any).options?.isLocal), []);

    const apiProviders = useMemo(() =>
        providers.filter(p => !localPluginIds.includes(p.pluginId)),
        [providers, localPluginIds]);

    if (isLoading) {
        return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    const handleUpdateProvider = async (id: string, updates: Partial<ApiTTSProviderItem> & { _edit?: boolean, _customSpeakers?: boolean }) => {
        const provider = providers.find(p => p.id === id);
        if (updates._edit) {
            if (provider) {
                setEditingProvider(provider);
                setIsAddModalOpen(true);
            }
            return;
        }
        if (updates._customSpeakers) {
            if (provider) {
                setEditingProvider(provider);
                setCustomSpeakersText((provider.customSpeakers || []).join("\n"));
                setIsCustomModalOpen(true);
            }
            return;
        }

        // Remove UI-only flags before saving
        const { _edit, _customSpeakers, ...persistentUpdates } = updates;
        await updateProvider(id, persistentUpdates);
    };

    const handleSaveCustomSpeakers = async () => {
        if (editingProvider) {
            const lines = customSpeakersText.split("\n").map(l => l.trim()).filter(l => l);
            await updateProvider(editingProvider.id, { customSpeakers: lines });
            setIsCustomModalOpen(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Local Models Section */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-base font-semibold mb-1.5">Local Models</h3>
                    <p className="text-sm text-muted">
                        Manage local TTS models. Load a model to use it for text-to-speech.
                    </p>
                </div>
                <div className="space-y-4">
                    {localPluginTypes.map((PluginClass) => {
                        const temp = new PluginClass() as any;
                        const pluginId = temp.info.id;
                        const instance = localTTS[pluginId];
                        const providerConfig = providers.find(p => p.pluginId === pluginId);

                        return (
                            <TTSItem
                                key={pluginId}
                                type="local"
                                id={pluginId}
                                pluginId={pluginId}
                                name={temp.info.name}
                                description={temp.info.description}
                                isLoaded={!!instance}
                                isLoading={isLocalLoading[pluginId]}
                                loadingProgress={loadingProgress[pluginId]}
                                instance={instance}
                                config={providerConfig}
                                options={temp.options}
                                variants={variants[pluginId] || []}
                                speakers={speakers[pluginId] || []}
                                isTesting={isTesting[pluginId]}
                                dataLoading={dataLoading}
                                onLoad={(vId?: string) => loadLocal(pluginId, vId)}
                                onUnload={() => unloadLocal(pluginId)}
                                onUpdate={(updates) => providerConfig && updateProvider(providerConfig.id, updates)}
                                onLoadVariants={() => loadVariants(pluginId, pluginId)}
                                onLoadSpeakers={() => instance && loadSpeakers(pluginId, pluginId, instance)}
                                onTest={(sId: string) => instance && testSpeaker(pluginId, instance, sId)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* API Providers Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold mb-1.5">API Providers</h3>
                        <p className="text-sm text-muted">
                            Configure cloud-based TTS providers.
                        </p>
                    </div>
                    <Button size="sm" variant="primary" onPress={() => setIsAddModalOpen(true)}>
                        Add Provider
                    </Button>
                </div>
                <div className="space-y-4">
                    {apiProviders.map((provider) => {
                        const pluginId = provider.pluginId;
                        const PluginClass = apiPluginTypes.find(p => (new p() as any).info.id === pluginId);
                        if (!PluginClass) return null;
                        const temp = new PluginClass() as any;

                        return (
                            <TTSItem
                                key={provider.id}
                                type="api"
                                id={provider.id}
                                pluginId={pluginId}
                                name={provider.name}
                                isEnabled={provider.enabled}
                                config={provider}
                                options={temp?.options}
                                variants={variants[provider.id] || []}
                                speakers={speakers[provider.id] || []}
                                isTesting={isTesting[provider.id]}
                                dataLoading={dataLoading}
                                onUpdate={(updates: any) => handleUpdateProvider(provider.id, updates)}
                                onDelete={() => deleteProvider(provider.id)}
                                onLoadVariants={() => loadVariants(provider.id, pluginId, { apiKey: provider.apiKey, url: provider.url })}
                                onLoadSpeakers={() => loadSpeakers(provider.id, pluginId, { apiKey: provider.apiKey, url: provider.url })}
                                onTest={(sId: string) => {
                                    const inst = new PluginClass() as any;
                                    inst.setConfig({ apiKey: provider.apiKey, url: provider.url });
                                    testSpeaker(provider.id, inst, sId);
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            <AddProviderModal
                isOpen={isAddModalOpen}
                onOpenChange={(open: boolean) => {
                    setIsAddModalOpen(open);
                    if (!open) setEditingProvider(null);
                }}
                pluginTypes={apiPluginTypes}
                onAdd={addProvider}
                editProvider={editingProvider}
                onUpdate={updateProvider}
            />

            <CustomSpeakersModal
                isOpen={isCustomModalOpen}
                provider={editingProvider}
                customSpeakersText={customSpeakersText}
                onOpenChange={setIsCustomModalOpen}
                onSave={handleSaveCustomSpeakers}
                onTextChange={setCustomSpeakersText}
            />
        </div>
    );
};

export default TTSTab;
