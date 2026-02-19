import { useState, useMemo, useEffect } from "react";
import { Modal, Button, Input, Label, Spinner } from "@heroui/react";
import { PlusIcon, TrashIcon, Search, Check } from "lucide-react";
import type { LLMProviderItem } from "@/shared/types/config";
import type { Model } from "../hooks/use-provider-actions";

interface ModelsModalProps {
    isOpen: boolean;
    provider: LLMProviderItem | null;
    isFetchingModels: boolean;
    onOpenChange: (open: boolean) => void;
    onFetchModels: () => Promise<void>;
    onSave: (models: Model[], selectedModelId?: string) => void;
}

interface CustomModel {
    id: string;
    name: string;
}

export const ModelsModal = ({
    isOpen,
    provider,
    isFetchingModels,
    onOpenChange,
    onFetchModels,
    onSave,
}: ModelsModalProps) => {
    const [customModels, setCustomModels] = useState<CustomModel[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [newModelId, setNewModelId] = useState("");
    const [newModelName, setNewModelName] = useState("");

    // Initialize custom models and selected model when provider changes
    useEffect(() => {
        if (provider && provider.models) {
            setCustomModels(provider.models.map(m => ({ id: m.id, name: m.name })));
            setSelectedModelId(provider.selectedModelId || "");
        } else {
            setCustomModels([]);
            setSelectedModelId("");
        }
    }, [provider?.id]); // Use provider.id as dependency to detect provider changes

    // Filter models based on search query
    const filteredModels = useMemo(() => {
        if (!searchQuery.trim()) return customModels;
        const query = searchQuery.toLowerCase();
        return customModels.filter(
            model =>
                model.name.toLowerCase().includes(query) ||
                model.id.toLowerCase().includes(query)
        );
    }, [customModels, searchQuery]);

    const handleAddCustomModel = () => {
        if (newModelId.trim()) {
            setCustomModels(prev => [...prev, { id: newModelId.trim(), name: newModelName.trim() || newModelId.trim() }]);
            setNewModelId("");
            setNewModelName("");
        }
    };

    const handleRemoveModel = (id: string) => {
        setCustomModels(prev => prev.filter(m => m.id !== id));
        if (selectedModelId === id) {
            setSelectedModelId("");
        }
    };

    const handleSetDefault = (modelId: string) => {
        setSelectedModelId(modelId);
    };

    const handleSave = () => {
        onSave(customModels, selectedModelId || undefined);
        onOpenChange(false);
    };

    const handleClose = () => {
        setCustomModels([]);
        setSelectedModelId("");
        setSearchQuery("");
        setNewModelId("");
        setNewModelName("");
        onOpenChange(false);
    };

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose}>
                <Modal.Container>
                    <Modal.Dialog className="sm:max-w-[500px]">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>
                                Manage Models - {provider?.name}
                            </Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="space-y-4 p-2">
                            {/* Fetch Models Section */}
                            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Fetch from API</p>
                                    <p className="text-xs text-muted">Get available models from provider</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onPress={onFetchModels}
                                    isDisabled={isFetchingModels}
                                >
                                    {isFetchingModels ? (
                                        <Spinner size="sm" color="current" />
                                    ) : (
                                        "Fetch"
                                    )}
                                </Button>
                            </div>

                            {/* Custom Models Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Custom Models</Label>
                                    <span className="text-xs text-muted">{customModels.length} models</span>
                                </div>

                                {/* Hint */}
                                <p className="text-xs text-muted">
                                    Click on a model to set it as default. The selected model will be highlighted with a checkmark.
                                </p>

                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search models..."
                                        variant="secondary"
                                        className="pl-9 w-full"
                                    />
                                </div>

                                {/* Add Model Form */}
                                <div className="flex gap-2">
                                    <Input
                                        value={newModelId}
                                        onChange={(e) => setNewModelId(e.target.value)}
                                        placeholder="Model ID (e.g., gpt-4o)"
                                        variant="secondary"
                                        className="flex-1"
                                    />
                                    <Input
                                        value={newModelName}
                                        onChange={(e) => setNewModelName(e.target.value)}
                                        placeholder="Display name (optional)"
                                        variant="secondary"
                                        className="flex-1"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        isIconOnly
                                        onPress={handleAddCustomModel}
                                        isDisabled={!newModelId.trim()}
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Models List */}
                                {filteredModels.length === 0 ? (
                                    <div className="text-center py-6 text-muted text-sm">
                                        {searchQuery ? "No models found" : "No models added yet"}
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                        {filteredModels.map((model) => (
                                            <div
                                                key={model.id}
                                                onClick={() => handleSetDefault(model.id)}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedModelId === model.id
                                                    ? 'bg-accent/20 border border-accent/50'
                                                    : 'bg-secondary/30 hover:bg-secondary/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {selectedModelId === model.id && (
                                                        <Check className="w-4 h-4 text-accent flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{model.name}</p>
                                                        <p className="text-xs text-muted truncate">{model.id}</p>
                                                    </div>
                                                </div>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        size="sm"
                                                        variant="tertiary"
                                                        isIconOnly
                                                        onPress={() => handleRemoveModel(model.id)}
                                                        className="h-7 w-7 min-w-7 text-danger hover:text-danger flex-shrink-0"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="tertiary" onPress={handleClose}>
                                Cancel
                            </Button>
                            <Button variant="primary" onPress={handleSave}>
                                Save
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
};
