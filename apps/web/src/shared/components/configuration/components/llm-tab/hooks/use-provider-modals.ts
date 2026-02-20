import { useState } from "react";
import OpenAI from "openai";
import type { LLMProviderItem } from "@/shared/types/config";
import { LLM_PROVIDER_TYPES } from "../constants/provider-types";
import { DEFAULT_API_LLM_ID } from "@/shared/constants/plugins";

// Helper function to generate a short random ID
function generateShortId(): string {
    return Math.random().toString(36).substr(2, 9);
}

export interface EditModalState {
    isOpen: boolean;
    provider: LLMProviderItem | null;
    isEditing: boolean;
}

interface UseProviderModalsProps {
    apiProviders: LLMProviderItem[];
    setApiProviders: React.Dispatch<React.SetStateAction<LLMProviderItem[]>>;
    saveConfig: (providers: LLMProviderItem[]) => Promise<void>;
    clearProviderError: (providerId: string) => void;
}

async function fetchModels(provider: LLMProviderItem): Promise<{ name: string; id: string }[]> {
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
        // Use DEFAULT_API_LLM_ID as the default provider type
        const defaultProviderType = LLM_PROVIDER_TYPES.find(p => p.id === DEFAULT_API_LLM_ID) || LLM_PROVIDER_TYPES[0];
        const defaultProvider = {
            id: generateShortId(),
            pluginId: defaultProviderType.pluginId || defaultProviderType.id,
            name: defaultProviderType.name,
            url: defaultProviderType.defaultUrl,
            apiKey: "",
            enabled: false,
            models: [],
        };
        setEditModal({ isOpen: true, provider: defaultProvider, isEditing: false });
    };

    const handleOpenEditModal = (provider: LLMProviderItem) => {
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
        const providerType = LLM_PROVIDER_TYPES.find(p => (p.pluginId || p.id) === pluginId);
        if (providerType) {
            setEditModal(prev => ({
                ...prev,
                provider: prev.provider ? {
                    ...prev.provider,
                    pluginId: providerType.pluginId || providerType.id,
                    name: providerType.name,
                    url: providerType.defaultUrl,
                } : null,
            }));
        }
    };

    const handleSaveProvider = async () => {
        if (!editModal.provider) return;

        setIsSaving(true);

        // Fetch models when adding a new provider with API key
        let providerToSave = { ...editModal.provider };
        if (!editModal.isEditing && providerToSave.apiKey) {
            const models = await fetchModels(providerToSave);
            providerToSave = { ...providerToSave, models };
        }

        // Compute updated providers synchronously
        let updatedProviders: LLMProviderItem[];
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

    const handleInputChange = (field: keyof LLMProviderItem, value: string | boolean) => {
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
