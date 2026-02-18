import { Button, Card } from "@heroui/react";
import React, { useState } from "react";
import type { TTSProvider, TTSProviderSpeaker } from "@odise/types";
import { EditProviderModal } from "./components/edit-provider-modal";
import { CustomSpeakersModal } from "./components/custom-speakers-modal";
import { ProviderCard, type ApiProviderWithExtras } from "./components/provider-card";
import { useApiProviders } from "./hooks/use-api-providers";
import { useProviderSpeakers, type ApiProviderWithSpeakers } from "./hooks/use-provider-speakers";
import { useProviderVariants, type ApiProviderWithVariants } from "./hooks/use-provider-variants";
import { useProviderModals } from "./hooks/use-provider-modals";

interface ApiSectionProps {
    plugins: TTSProvider[];
    getSpeakers: (pluginId: string) => Promise<TTSProviderSpeaker[]>;
    configureNonLocalProvider: (pluginId: string, config: { apiKey: string; url: string }) => TTSProvider | null;
}

type ApiProviderWithAllExtras = ApiProviderWithExtras & ApiProviderWithSpeakers & ApiProviderWithVariants;

const ApiSection = ({
    plugins,
    getSpeakers,
    configureNonLocalProvider,
}: ApiSectionProps) => {
    const [expandedSpeakers, setExpandedSpeakers] = useState<Record<string, boolean>>({});

    const apiPlugins = plugins.filter(p => !p.options?.isLocal);

    // Use custom hooks
    const {
        apiProviders,
        setApiProviders,
        providersWithErrors,
        saveConfig,
        clearProviderError,
    } = useApiProviders();

    const {
        selectedSpeakers,
        testLoading,
        handleSpeakerSelect,
        handleTestSpeaker,
    } = useProviderSpeakers({
        apiProviders: apiProviders as ApiProviderWithSpeakers[],
        setApiProviders: setApiProviders as React.Dispatch<React.SetStateAction<ApiProviderWithSpeakers[]>>,
        providersWithErrors,
        getSpeakers,
        configureNonLocalProvider,
    });

    const {
        selectedVariants,
        handleVariantChange,
    } = useProviderVariants({
        apiProviders: apiProviders as ApiProviderWithVariants[],
        setApiProviders: setApiProviders as React.Dispatch<React.SetStateAction<ApiProviderWithVariants[]>>,
        plugins,
        configureNonLocalProvider,
    });

    const {
        editModal,
        customSpeakersModal,
        customSpeakersText,
        setCustomSpeakersText,
        handleOpenAddModal,
        handleOpenEditModal,
        handleCloseEditModal,
        handleEditModalOpenChange,
        handleSaveProvider,
        handleDeleteProvider,
        handleInputChange,
        handleOpenCustomSpeakersModal,
        handleCloseCustomSpeakersModal,
        handleCustomSpeakersModalOpenChange,
        handleSaveCustomSpeakers,
    } = useProviderModals({
        apiPlugins,
        setApiProviders,
        saveConfig,
        clearProviderError,
    });

    const toggleSpeakers = (providerUid: string) => {
        setExpandedSpeakers(prev => ({ ...prev, [providerUid]: !prev[providerUid] }));
    };

    const handleToggleEnabled = async (providerUid: string) => {
        const updatedProviders = apiProviders.map(p =>
            p.uid === providerUid ? { ...p, enabled: !p.enabled } : p
        );
        setApiProviders(updatedProviders);
        await saveConfig(updatedProviders);
        // Clear error flag when provider is re-enabled
        const provider = updatedProviders.find(p => p.uid === providerUid);
        if (provider?.enabled) {
            clearProviderError(providerUid);
        }
    };

    const handleVariantChangeWrapper = (providerUid: string) => (key: React.Key | null) => {
        handleVariantChange(providerUid, key, saveConfig);
    };

    const handleTestSpeakerWrapper = (providerUid: string) => () => {
        const selectedVariantId = (apiProviders.find(p => p.uid === providerUid)?.selectedModelId || selectedVariants[providerUid]);
        handleTestSpeaker(providerUid, selectedVariantId);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold mb-1.5">API Providers</h3>
                    <p className="text-sm text-muted">
                        Configure cloud-based TTS providers.
                    </p>
                </div>
                <Button size="sm" variant="outline" onPress={handleOpenAddModal}>
                    Add Provider
                </Button>
            </div>

            {apiProviders.length === 0 ? (
                <Card variant="secondary" className="p-6">
                    <Card.Content>
                        <p className="text-center text-muted">No API TTS providers configured</p>
                    </Card.Content>
                </Card>
            ) : (
                <div className="space-y-4">
                    {apiProviders.map((provider) => {
                        const plugin = plugins.find(p => p.info?.id === provider.id);
                        const providerWithExtras = provider as ApiProviderWithAllExtras;

                        return (
                            <ProviderCard
                                key={provider.uid}
                                provider={providerWithExtras}
                                plugin={plugin}
                                expandedSpeakers={expandedSpeakers}
                                selectedSpeakerId={selectedSpeakers[provider.uid]}
                                testLoading={testLoading[provider.uid] || false}
                                onToggleSpeakers={toggleSpeakers}
                                onSpeakerSelect={(speakerId) => handleSpeakerSelect(provider.uid, speakerId)}
                                onTestSpeaker={handleTestSpeakerWrapper(provider.uid)}
                                onOpenCustomSpeakers={() => handleOpenCustomSpeakersModal(provider)}
                                onEdit={() => handleOpenEditModal(provider)}
                                onDelete={() => handleDeleteProvider(provider.uid)}
                                onToggleEnabled={() => handleToggleEnabled(provider.uid)}
                                onVariantChange={handleVariantChangeWrapper(provider.uid)}
                            />
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            <EditProviderModal
                isOpen={editModal.isOpen}
                isEditing={editModal.isEditing}
                provider={editModal.provider}
                apiPlugins={apiPlugins}
                onOpenChange={handleEditModalOpenChange}
                onSave={handleSaveProvider}
                onInputChange={handleInputChange}
            />

            {/* Custom Speakers Modal */}
            <CustomSpeakersModal
                isOpen={customSpeakersModal.isOpen}
                provider={customSpeakersModal.provider}
                customSpeakersText={customSpeakersText}
                onOpenChange={handleCustomSpeakersModalOpenChange}
                onSave={handleSaveCustomSpeakers}
                onTextChange={setCustomSpeakersText}
            />
        </div>
    );
};

export default ApiSection;
