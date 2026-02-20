import { useMemo, useState } from "react";
import { Button, Card, Spinner } from "@heroui/react";
import type { EmbeddingProviderItem } from "@/shared/types/config";
import { useEmbeddingProviders } from "./hooks/use-embedding-providers";
import { useProviderActions } from "./hooks/use-provider-actions";
import { useLocalEmbedding } from "./hooks/use-local-embedding";
import { useProviderModals } from "./hooks/use-provider-modals";
import { plugins_registry } from "@/shared/constants/plugins";
import { EditProviderModal } from "./components/edit-provider-modal";
import { ModelsModal } from "./components/models-modal";
import { ProviderCard } from "./components/provider-card";

const EmbeddingTab = () => {
    const {
        apiProviders,
        setApiProviders,
        saveConfig,
        clearProviderError,
    } = useEmbeddingProviders();

    const {
        editModal,
        handleOpenAddModal,
        handleOpenEditModal,
        handleEditModalOpenChange,
        handleSaveProvider,
        handleDeleteProvider,
        handleInputChange,
        handleProviderTypeChange,
    } = useProviderModals({
        apiProviders,
        setApiProviders,
        saveConfig,
        clearProviderError,
    });

    const {
        isTesting,
        isFetchingModels,
        testResults,
        testProvider,
        fetchModels,
    } = useProviderActions();

    const {
        localEmbedding,
        isLoading: isLocalLoading,
        loadingProgress,
        loadLocal,
        unloadLocal
    } = useLocalEmbedding();

    // Models modal state
    const [modelsModal, setModelsModal] = useState<{
        isOpen: boolean;
        provider: EmbeddingProviderItem | null;
    }>({ isOpen: false, provider: null });

    const handleToggleEnabled = async (providerId: string) => {
        const updatedProviders = apiProviders.map(p =>
            p.id === providerId ? { ...p, enabled: !p.enabled } : p
        );
        setApiProviders(updatedProviders);
        await saveConfig(updatedProviders);
        if (updatedProviders.find(p => p.id === providerId)?.enabled) {
            clearProviderError(providerId);
        }
    };

    const handleOpenModelsModal = (provider: EmbeddingProviderItem) => {
        setModelsModal({ isOpen: true, provider });
    };

    const handleCloseModelsModal = () => {
        setModelsModal({ isOpen: false, provider: null });
    };

    const handleFetchModels = async () => {
        if (!modelsModal.provider) return;
        const models = await fetchModels(modelsModal.provider);
        const updatedProviders = apiProviders.map(p =>
            p.id === modelsModal.provider!.id ? { ...p, models } : p
        );
        setApiProviders(updatedProviders);
        await saveConfig(updatedProviders);
        setModelsModal(prev => ({
            ...prev,
            provider: prev.provider ? { ...prev.provider, models } : null,
        }));
    };

    const handleSaveModels = async (models: { name: string; id: string }[], selectedModelId?: string) => {
        if (!modelsModal.provider) return;
        const updatedProviders = apiProviders.map(p =>
            p.id === modelsModal.provider!.id ? { ...p, models, selectedModelId } : p
        );
        setApiProviders(updatedProviders);
        await saveConfig(updatedProviders);
    };

    // Registry grouping
    const localPluginTypes = useMemo(() =>
        plugins_registry.filter(p => {
            try {
                return (new p() as any).options?.isLocal && (new p() as any).embed;
            } catch { return false; }
        }), []);

    return (
        <div className="space-y-8">
            {/* Local Models Section */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-base font-semibold mb-1.5">Local Models</h3>
                    <p className="text-sm text-muted">
                        Manage local embedding models.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {localPluginTypes.map((PluginClass) => {
                        const temp = new PluginClass() as any;
                        const pluginId = temp.info.id;
                        const isLoaded = !!localEmbedding[pluginId];
                        const isLoading = isLocalLoading[pluginId];

                        return (
                            <Card key={pluginId} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">{temp.info.name}</h4>
                                        <p className="text-xs text-muted">{temp.info.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isLoading && <Spinner size="sm" />}
                                        <Button
                                            size="sm"
                                            variant={isLoaded ? "ghost" : "primary"}
                                            onPress={() => isLoaded ? unloadLocal(pluginId) : loadLocal(pluginId)}
                                            isDisabled={isLoading}
                                        >
                                            {isLoaded ? "Unload" : "Load"}
                                        </Button>
                                    </div>
                                </div>
                                {isLoading && loadingProgress[pluginId] !== undefined && (
                                    <div className="mt-2 h-1 w-full bg-accent/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent transition-all duration-300"
                                            style={{ width: `${loadingProgress[pluginId]}%` }}
                                        />
                                    </div>
                                )}
                            </Card>
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
                            Configure cloud-based embedding providers.
                        </p>
                    </div>
                    <Button size="sm" variant="outline" onPress={handleOpenAddModal}>
                        Add Provider
                    </Button>
                </div>

                {apiProviders.length === 0 ? (
                    <Card variant="secondary" className="p-6">
                        <p className="text-center text-muted">No embedding providers configured</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {apiProviders.map((provider) => (
                            <ProviderCard
                                key={provider.id}
                                provider={provider}
                                onEdit={() => handleOpenEditModal(provider)}
                                onDelete={() => handleDeleteProvider(provider.id)}
                                onToggleEnabled={() => handleToggleEnabled(provider.id)}
                                onTest={() => testProvider(provider)}
                                onOpenModels={() => handleOpenModelsModal(provider)}
                                isTesting={isTesting[provider.id] || false}
                                testResult={testResults[provider.id]}
                            />
                        ))}
                    </div>
                )}
            </div>

            <EditProviderModal
                isOpen={editModal.isOpen}
                isEditing={editModal.isEditing}
                provider={editModal.provider}
                onOpenChange={handleEditModalOpenChange}
                onSave={handleSaveProvider}
                onInputChange={handleInputChange}
                onProviderTypeChange={handleProviderTypeChange}
            />

            <ModelsModal
                isOpen={modelsModal.isOpen}
                provider={modelsModal.provider}
                isFetchingModels={isFetchingModels[modelsModal.provider?.id || ""] || false}
                onOpenChange={handleCloseModelsModal}
                onFetchModels={handleFetchModels}
                onSave={handleSaveModels}
            />
        </div>
    );
};

export default EmbeddingTab;
