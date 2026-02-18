import { useState } from "react";
import OpenAI from "openai";
import type { ApiLLMProviderItem } from "@/shared/types/config";
import { LLM_PROVIDER_TYPES } from "../constants/provider-types";

export interface EditModalState {
    isOpen: boolean;
    provider: ApiLLMProviderItem | null;
    isEditing: boolean;
}

interface UseProviderModalsProps {
    setApiProviders: React.Dispatch<React.SetStateAction<ApiLLMProviderItem[]>>;
    saveConfig: (providers: ApiLLMProviderItem[]) => Promise<void>;
    clearProviderError: (providerId: string) => void;
}

async function fetchModels(provider: ApiLLMProviderItem): Promise<{ name: string; id: string }[]> {
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
    setApiProviders,
    saveConfig,
    clearProviderError,
}: UseProviderModalsProps) {
    const [editModal, setEditModal] = useState<EditModalState>({ isOpen: false, provider: null, isEditing: false });
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenAddModal = () => {
        const firstProviderType = LLM_PROVIDER_TYPES[0];
        const defaultProvider = {
            id: firstProviderType.id,
            uid: crypto.randomUUID(),
            name: firstProviderType.name,
            url: firstProviderType.defaultUrl,
            apiKey: "",
            enabled: false,
            models: [],
        };
        setEditModal({ isOpen: true, provider: defaultProvider, isEditing: false });
    };

    const handleOpenEditModal = (provider: ApiLLMProviderItem) => {
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

    const handleProviderTypeChange = (providerId: string) => {
        const providerType = LLM_PROVIDER_TYPES.find(p => p.id === providerId);
        if (providerType) {
            setEditModal(prev => ({
                ...prev,
                provider: prev.provider ? {
                    ...prev.provider,
                    id: providerType.id,
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

        let updatedProviders: ApiLLMProviderItem[];

        if (editModal.isEditing) {
            setApiProviders((prev: ApiLLMProviderItem[]) => {
                updatedProviders = prev.map(p =>
                    p.uid === providerToSave.uid ? providerToSave : p
                );
                return updatedProviders;
            });
        } else {
            setApiProviders((prev: ApiLLMProviderItem[]) => {
                updatedProviders = [...prev, providerToSave];
                return updatedProviders;
            });
        }

        await saveConfig(updatedProviders!);
        clearProviderError(providerToSave.uid);
        handleCloseEditModal();
        setIsSaving(false);
    };

    const handleDeleteProvider = async (providerUid: string) => {
        let updatedProviders: ApiLLMProviderItem[];
        setApiProviders((prev: ApiLLMProviderItem[]) => {
            updatedProviders = prev.filter(p => p.uid !== providerUid);
            return updatedProviders;
        });
        await saveConfig(updatedProviders!);
    };

    const handleInputChange = (field: keyof ApiLLMProviderItem, value: string | boolean) => {
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
