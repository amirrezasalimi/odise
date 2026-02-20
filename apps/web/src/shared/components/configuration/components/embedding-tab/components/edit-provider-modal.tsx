import { Modal, Button, Input, Label, Select, ListBox } from "@heroui/react";
import type { EmbeddingProviderItem } from "@/shared/types/config";
import { EMBEDDING_PROVIDER_TYPES } from "../constants/provider-types";

interface EditProviderModalProps {
    isOpen: boolean;
    isEditing: boolean;
    provider: EmbeddingProviderItem | null;
    onOpenChange: (open: boolean) => void;
    onSave: () => void;
    onInputChange: (field: keyof EmbeddingProviderItem, value: string | boolean) => void;
    onProviderTypeChange: (providerId: string) => void;
}

export const EditProviderModal = ({
    isOpen,
    isEditing,
    provider,
    onOpenChange,
    onSave,
    onInputChange,
    onProviderTypeChange,
}: EditProviderModalProps) => {
    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
                <Modal.Container>
                    <Modal.Dialog className="sm:max-w-105">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>
                                {isEditing ? "Edit Provider" : "Add Provider"}
                            </Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="space-y-4 p-2">
                            <div className="space-y-2">
                                <Label htmlFor="provider-type">Provider Type</Label>
                                <Select
                                    id="provider-type"
                                    className="w-full"
                                    placeholder="Select a provider"
                                    variant="secondary"
                                    selectedKey={provider?.pluginId || ""}
                                    onSelectionChange={(key) => {
                                        onProviderTypeChange(key as string);
                                    }}
                                    isDisabled={isEditing}
                                >
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox>
                                            {EMBEDDING_PROVIDER_TYPES.map((providerType) => (
                                                <ListBox.Item
                                                    key={providerType.id}
                                                    id={providerType.id}
                                                    textValue={providerType.name}
                                                >
                                                    {providerType.name}
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                            ))}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="provider-name">Name</Label>
                                <Input
                                    id="provider-name"
                                    value={provider?.name || ""}
                                    onChange={(e) => onInputChange("name", e.target.value)}
                                    placeholder="Provider name"
                                    variant="secondary"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="provider-url">API URL</Label>
                                <Input
                                    id="provider-url"
                                    value={provider?.url || ""}
                                    onChange={(e) => onInputChange("url", e.target.value)}
                                    placeholder="https://api.example.com/v1"
                                    variant="secondary"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="provider-api-key">API Key</Label>
                                <Input
                                    id="provider-api-key"
                                    type="password"
                                    value={provider?.apiKey || ""}
                                    onChange={(e) => onInputChange("apiKey", e.target.value)}
                                    placeholder="sk-..."
                                    variant="secondary"
                                    className="w-full"
                                />
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onPress={onSave}>
                                {isEditing ? "Save" : "Add"}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
};
