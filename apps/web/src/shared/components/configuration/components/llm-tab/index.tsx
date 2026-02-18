import { useState } from "react";
import { Button, Card } from "@heroui/react";
import type { ApiLLMProviderItem } from "@/shared/types/config";
import { EditProviderModal } from "./components/edit-provider-modal";
import { ModelsModal } from "./components/models-modal";
import { ProviderCard } from "./components/provider-card";
import { useLLMProviders } from "./hooks/use-llm-providers";
import { useProviderModals } from "./hooks/use-provider-modals";
import { useProviderActions } from "./hooks/use-provider-actions";

const LLMTab = () => {
    // Use custom hooks
    const {
        apiProviders,
        setApiProviders,
        saveConfig,
        clearProviderError,
    } = useLLMProviders();

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

    // Models modal state
    const [modelsModal, setModelsModal] = useState<{
        isOpen: boolean;
        provider: ApiLLMProviderItem | null;
    }>({ isOpen: false, provider: null });

    const handleToggleEnabled = async (providerId: string) => {
        const updatedProviders = apiProviders.map(p =>
            p.id === providerId ? { ...p, enabled: !p.enabled } : p
        );
        setApiProviders(updatedProviders);
        await saveConfig(updatedProviders);
        // Clear error flag when provider is re-enabled
        const provider = updatedProviders.find(p => p.id === providerId);
        if (provider?.enabled) {
            clearProviderError(providerId);
        }
    };

    const handleTestProvider = async (provider: ApiLLMProviderItem) => {
        await testProvider(provider);
    };

    const handleOpenModelsModal = (provider: ApiLLMProviderItem) => {
        setModelsModal({ isOpen: true, provider });
    };

    const handleCloseModelsModal = () => {
        setModelsModal({ isOpen: false, provider: null });
    };

    const handleFetchModels = async () => {
        if (!modelsModal.provider) return;
        const models = await fetchModels(modelsModal.provider);
        // Update provider with fetched models
        const updatedProviders = apiProviders.map(p =>
            p.id === modelsModal.provider!.id ? { ...p, models } : p
        );
        setApiProviders(updatedProviders);
        await saveConfig(updatedProviders);
        // Update modal provider reference
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold mb-1.5">LLM Providers</h3>
                    <p className="text-sm text-muted">
                        Configure cloud-based LLM providers.
                    </p>
                </div>
                <Button size="sm" variant="outline" onPress={handleOpenAddModal}>
                    Add Provider
                </Button>
            </div>

            {apiProviders.length === 0 ? (
                <Card variant="secondary" className="p-6">
                    <Card.Content>
                        <p className="text-center text-muted">No LLM providers configured</p>
                    </Card.Content>
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
                            onTest={() => handleTestProvider(provider)}
                            onOpenModels={() => handleOpenModelsModal(provider)}
                            isTesting={isTesting[provider.id] || false}
                            testResult={testResults[provider.id]}
                        />
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <EditProviderModal
                isOpen={editModal.isOpen}
                isEditing={editModal.isEditing}
                provider={editModal.provider}
                onOpenChange={handleEditModalOpenChange}
                onSave={handleSaveProvider}
                onInputChange={handleInputChange}
                onProviderTypeChange={handleProviderTypeChange}
            />

            {/* Models Modal */}
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

export default LLMTab;
