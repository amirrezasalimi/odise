import { useState } from "react";
import OpenAI from "openai";
import type { EmbeddingProviderItem } from "@/shared/types/config";
import { EMBEDDING_PROVIDER_TYPES } from "../constants/provider-types";
import { DEFAULT_API_EMBEDDING_ID } from "@/shared/constants/plugins";

function generateShortId(): string {
    return Math.random().toString(36).substr(2, 9);
}

export interface EditModalState {
    isOpen: boolean;
    provider: EmbeddingProviderItem | null;
    isEditing: boolean;
}

interface UseProviderModalsProps {
    apiProviders: EmbeddingProviderItem[];
    setApiProviders: React.Dispatch<React.SetStateAction<EmbeddingProviderItem[]>>;
    saveConfig: (providers: EmbeddingProviderItem[]) => Promise<void>;
    clearProviderError: (providerId: string) => void;
}

async function fetchModels(provider: EmbeddingProviderItem): Promise<{ name: string; id: string }[]> {
    try {
        const client = new OpenAI({
            apiKey: provider.apiKey,
            baseURL: provider.url,
            dangerouslyAllowBrowser: true,
        });

        const response = await client.models.list();
        return response.data.map(model => ({
            id: model.id,
            name: model.id,
        }));
    } catch (error) {
        console.error("Failed to fetch models:", error);
        return [];
    }
}

export function useProviderModals({
    apiProviders,
    setApiProviders,
    saveConfig,
    clearProviderError,
}: UseProviderModalsProps) {
    const [editModal, setEditModal] = useState<EditModalState>({ isOpen: false, provider: null, isEditing: false });
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenAddModal = () => {
        // Use DEFAULT_API_EMBEDDING_ID as the default pluginId
        const defaultProviderType = EMBEDDING_PROVIDER_TYPES.find(p => p.id === DEFAULT_API_EMBEDDING_ID) || EMBEDDING_PROVIDER_TYPES[0];
        const defaultProvider = {
            id: generateShortId(),
            pluginId: defaultProviderType.id,
            name: defaultProviderType.name,
            url: defaultProviderType.defaultUrl,
            apiKey: "",
            enabled: true,
            models: [],
        };
        setEditModal({ isOpen: true, provider: defaultProvider, isEditing: false });
    };

    const handleOpenEditModal = (provider: EmbeddingProviderItem) => {
        setEditModal({ isOpen: true, provider: { ...provider }, isEditing: true });
    };

    const handleCloseEditModal = () => {
        setEditModal({ isOpen: false, provider: null, isEditing: false });
    };

    const handleEditModalOpenChange = (open: boolean) => {
        if (!open) {
            handleCloseEditModal();
        }
    };

    const handleProviderTypeChange = (pluginId: string) => {
        const providerType = EMBEDDING_PROVIDER_TYPES.find(p => p.id === pluginId);
        if (providerType) {
            setEditModal(prev => ({
                ...prev,
                provider: prev.provider ? {
                    ...prev.provider,
                    pluginId: providerType.id,
                    name: providerType.name,
                    url: providerType.defaultUrl,
                } : null,
            }));
        }
    };

    const handleSaveProvider = async () => {
        if (!editModal.provider) return;

        setIsSaving(true);

        let providerToSave = { ...editModal.provider };
        if (!editModal.isEditing && providerToSave.apiKey) {
            const models = await fetchModels(providerToSave);
            providerToSave = { ...providerToSave, models };
        }

        let updatedProviders: EmbeddingProviderItem[];
        if (editModal.isEditing) {
            updatedProviders = apiProviders.map(p =>
                p.id === providerToSave.id ? providerToSave : p
            );
        } else {
            updatedProviders = [...apiProviders, providerToSave];
        }

        setApiProviders(updatedProviders);
        await saveConfig(updatedProviders);
        clearProviderError(providerToSave.id);
        handleCloseEditModal();
        setIsSaving(false);
    };

    const handleDeleteProvider = async (providerId: string) => {
        const updatedProviders = apiProviders.filter(p => p.id !== providerId);
        setApiProviders(updatedProviders);
        await saveConfig(updatedProviders);
    };

    const handleInputChange = (field: keyof EmbeddingProviderItem, value: string | boolean) => {
        setEditModal(prev => ({
            ...prev,
            provider: prev.provider ? { ...prev.provider, [field]: value } : null,
        }));
    };

    return {
        editModal,
        isSaving,
        handleOpenAddModal,
        handleOpenEditModal,
        handleCloseEditModal,
        handleEditModalOpenChange,
        handleSaveProvider,
        handleDeleteProvider,
        handleInputChange,
        handleProviderTypeChange,
    };
}
