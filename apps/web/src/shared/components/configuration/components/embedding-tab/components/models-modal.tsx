import { Modal, Button, Spinner } from "@heroui/react";
import type { EmbeddingProviderItem } from "@/shared/types/config";
import { RefreshCw, Check } from "lucide-react";

interface ModelsModalProps {
    isOpen: boolean;
    provider: EmbeddingProviderItem | null;
    isFetchingModels: boolean;
    onOpenChange: (open: boolean) => void;
    onFetchModels: () => void;
    onSave: (models: { name: string; id: string }[], selectedModelId?: string) => void;
}

export const ModelsModal = ({
    isOpen,
    provider,
    isFetchingModels,
    onOpenChange,
    onFetchModels,
    onSave,
}: ModelsModalProps) => {
    if (!provider) return null;

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
                <Modal.Container>
                    <Modal.Dialog className="sm:max-w-105">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>Manage Models</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="p-2 space-y-4">
                            <div className="flex justify-end">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onPress={onFetchModels}
                                    isDisabled={isFetchingModels}
                                    className="gap-2"
                                >
                                    {isFetchingModels ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <RefreshCw className="size-3.5" />
                                    )}
                                    Fetch Models
                                </Button>
                            </div>

                            <div className="max-h-75 overflow-y-auto pr-1">
                                {!provider.models || provider.models.length === 0 ? (
                                    <p className="text-center text-sm text-muted py-8">
                                        No models fetched yet.
                                    </p>
                                ) : (
                                    <div className="space-y-1">
                                        {provider.models.map((model) => (
                                            <div
                                                key={model.id}
                                                onClick={() => onSave(provider.models || [], model.id)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-xl hover:bg-accent/5 transition-colors cursor-pointer ${provider.selectedModelId === model.id ? 'bg-accent/10' : ''
                                                    }`}
                                            >
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium">{model.name}</span>
                                                    <span className="text-xs text-muted truncate max-w-70">{model.id}</span>
                                                </div>
                                                {provider.selectedModelId === model.id && (
                                                    <Check className="size-4 text-accent shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="primary" className="w-full" onPress={() => onOpenChange(false)}>
                                Done
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
};

