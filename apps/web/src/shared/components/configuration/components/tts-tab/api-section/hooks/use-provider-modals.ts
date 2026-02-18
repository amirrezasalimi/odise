import { useState } from "react";
import type { TTSProvider } from "@odise/types";
import type { ApiTTSProviderItem } from "@/shared/types/config";
import type OpenAITTSProvider from "@odise/openai";

export interface EditModalState {
    isOpen: boolean;
    provider: ApiTTSProviderItem | null;
    isEditing: boolean;
}

export interface CustomSpeakersModalState {
    isOpen: boolean;
    provider: ApiTTSProviderItem | null;
}

interface UseProviderModalsProps {
    apiPlugins: TTSProvider[];
    setApiProviders: React.Dispatch<React.SetStateAction<ApiTTSProviderItem[]>>;
    saveConfig: (providers: ApiTTSProviderItem[]) => Promise<void>;
    clearProviderError: (providerId: string) => void;
}

export function useProviderModals({
    apiPlugins,
    setApiProviders,
    saveConfig,
    clearProviderError,
}: UseProviderModalsProps) {
    const [editModal, setEditModal] = useState<EditModalState>({ isOpen: false, provider: null, isEditing: false });
    const [customSpeakersModal, setCustomSpeakersModal] = useState<CustomSpeakersModalState>({ isOpen: false, provider: null });
    const [customSpeakersText, setCustomSpeakersText] = useState<string>("");

    const handleOpenAddModal = async () => {
        const firstPlugin = apiPlugins[0] as OpenAITTSProvider;

        let defaultModelId = firstPlugin.options?.defaultVariant;

        if (firstPlugin?.options?.hasVariants && firstPlugin.loadVariants) {
            try {
                const variants = await firstPlugin.loadVariants();
                if (variants.length > 0) {
                    defaultModelId = variants[0].id;
                }
            } catch (error) {
                console.error("Failed to load variants for default provider:", error);
            }
        }

        const defaultProvider = firstPlugin ? {
            id: firstPlugin.info?.id || "",
            uid: crypto.randomUUID(),
            name: firstPlugin.info?.name || "",
            url: firstPlugin.getApiUrl(),
            apiKey: "",
            enabled: false,
            selectedModelId: defaultModelId,
            customSpeakers: []
        } : null;
        setEditModal({ isOpen: true, provider: defaultProvider, isEditing: false });
    };

    const handleOpenEditModal = (provider: ApiTTSProviderItem) => {
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

    const handleSaveProvider = async () => {
        if (!editModal.provider) return;

        let updatedProviders: ApiTTSProviderItem[];

        if (editModal.isEditing) {
            setApiProviders((prev: ApiTTSProviderItem[]) => {
                updatedProviders = prev.map(p =>
                    p.uid === editModal.provider!.uid ? editModal.provider! : p
                );
                return updatedProviders;
            });
        } else {
            setApiProviders((prev: ApiTTSProviderItem[]) => {
                updatedProviders = [...prev, editModal.provider!];
                return updatedProviders;
            });
        }

        await saveConfig(updatedProviders!);
        clearProviderError(editModal.provider!.uid);
        handleCloseEditModal();
    };

    const handleDeleteProvider = async (providerUid: string) => {
        let updatedProviders: ApiTTSProviderItem[];
        setApiProviders((prev: ApiTTSProviderItem[]) => {
            updatedProviders = prev.filter(p => p.uid !== providerUid);
            return updatedProviders;
        });
        await saveConfig(updatedProviders!);
    };

    const handleInputChange = (field: keyof ApiTTSProviderItem, value: string | boolean) => {
        setEditModal(prev => ({
            ...prev,
            provider: prev.provider ? { ...prev.provider, [field]: value } : null,
        }));
    };

    const handleOpenCustomSpeakersModal = (provider: ApiTTSProviderItem) => {
        setCustomSpeakersModal({ isOpen: true, provider });
        setCustomSpeakersText((provider.customSpeakers || []).join('\n'));
    };

    const handleCloseCustomSpeakersModal = () => {
        setCustomSpeakersModal({ isOpen: false, provider: null });
        setCustomSpeakersText("");
    };

    const handleCustomSpeakersModalOpenChange = (open: boolean) => {
        if (!open) {
            handleCloseCustomSpeakersModal();
        }
    };

    const handleSaveCustomSpeakers = async () => {
        if (!customSpeakersModal.provider) return;

        const customSpeakers = customSpeakersText
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        let updatedProviders: ApiTTSProviderItem[];
        setApiProviders((prev: ApiTTSProviderItem[]) => {
            updatedProviders = prev.map(p =>
                p.uid === customSpeakersModal.provider!.uid
                    ? { ...p, customSpeakers }
                    : p
            );
            return updatedProviders;
        });

        await saveConfig(updatedProviders!);
        handleCloseCustomSpeakersModal();
    };

    return {
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
    };
}
