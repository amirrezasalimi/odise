import { useMemo, useState } from "react";
import { Button, Card, Spinner, Separator } from "@heroui/react";
import { Database } from "lucide-react";
import type { EmbeddingProviderItem } from "@/shared/types/config";
import { useEmbeddingProviders } from "./hooks/use-embedding-providers";
import { useProviderActions } from "./hooks/use-provider-actions";
import { useLocalEmbedding } from "./hooks/use-local-embedding";
import { useProviderModals } from "./hooks/use-provider-modals";
import { DEFAULT_EMBEDDING_MODELS } from "@/shared/constants/plugins";
import { EditProviderModal } from "./components/edit-provider-modal";
import { ModelsModal } from "./components/models-modal";
import { ProviderCard } from "./components/provider-card";
import { useProviderData } from "./hooks/use-provider-data";
import { LocalEmbeddingItem } from "./components/local-embedding-item";
import { BenchmarkModal } from "./components/benchmark-modal";

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

    const { variants, loadVariants, isLoading: dataLoading } = useProviderData();

    const externalProviders = useMemo(() => {
        return apiProviders.filter(p => !DEFAULT_EMBEDDING_MODELS.find(m => m.id === p.id));
    }, [apiProviders]);

    // Models modal state
    const [modelsModal, setModelsModal] = useState<{
        isOpen: boolean;
        provider: EmbeddingProviderItem | null;
    }>({ isOpen: false, provider: null });

    // Benchmark state
    const [benchmarkModal, setBenchmarkModal] = useState<{
        isOpen: boolean;
        modelId: string | null;
        name: string | null;
    }>({ isOpen: false, modelId: null, name: null });

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

    const runBenchmark = async (text: string) => {
        const { modelId } = benchmarkModal;
        if (!modelId || !localEmbedding[modelId]) {
            throw new Error("No model loaded");
        }

        const start = performance.now();
        const result = await localEmbedding[modelId].embed(text);
        const end = performance.now();

        const timeMs = end - start;
        return {
            timeMs,
            dimension: result.embedding.length,
            charsPerSec: Math.round((text.length / timeMs) * 1000),
        };
    };

    return (
        <div className="space-y-12">
            {/* Local Models Section */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-base font-semibold mb-1.5">Local Computing</h2>
                    <p className="text-sm text-muted">
                        On-device embedding models using Transformers.js.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {DEFAULT_EMBEDDING_MODELS.map((model) => (
                        <LocalEmbeddingItem
                            key={model.id}
                            pluginId={model.pluginId}
                            name={model.name}
                            description={`Model Source: ${model.modelId}`}
                            isLoaded={!!localEmbedding[model.id]}
                            isLoading={isLocalLoading[model.id]}
                            loadingProgress={loadingProgress[model.id]}
                            onLoad={() => loadLocal(model)}
                            onUnload={() => unloadLocal(model.id)}
                            onBenchmark={() => setBenchmarkModal({ isOpen: true, modelId: model.id, name: model.name })}
                        />
                    ))}
                </div>
            </section>

            {/* API Providers Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold mb-1.5">Cloud Providers</h2>
                        <p className="text-sm text-muted">
                            Connect to external embedding APIs.
                        </p>
                    </div>
                    <Button variant="outline" onPress={handleOpenAddModal}>
                        Add Provider
                    </Button>
                </div>

                {externalProviders.length === 0 ? (
                    <Card variant="secondary">
                        <Card.Content>
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Database className="w-8 h-8 text-muted/40" />
                                <p className="text-sm text-muted">No external providers configured.</p>
                            </div>
                        </Card.Content>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {externalProviders.map((provider) => (
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
            </section>

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

            <BenchmarkModal
                isOpen={benchmarkModal.isOpen}
                onOpenChange={(open) => setBenchmarkModal(prev => ({ ...prev, isOpen: open }))}
                modelName={benchmarkModal.name || ""}
                onRunBenchmark={runBenchmark}
            />
        </div>
    );
};

export default EmbeddingTab;
