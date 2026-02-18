import { Modal, Button, Input, Select, Label, ListBox } from "@heroui/react";
import type { TTSProvider } from "@odise/types";
import type { ApiTTSProviderItem } from "@/shared/types/config";

interface EditProviderModalProps {
    isOpen: boolean;
    isEditing: boolean;
    provider: ApiTTSProviderItem | null;
    apiPlugins: TTSProvider[];
    onOpenChange: (open: boolean) => void;
    onSave: () => void;
    onInputChange: (field: keyof ApiTTSProviderItem, value: string | boolean) => void;
}

export const EditProviderModal = ({
    isOpen,
    isEditing,
    provider,
    apiPlugins,
    onOpenChange,
    onSave,
    onInputChange,
}: EditProviderModalProps) => {
    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
                <Modal.Container>
                    <Modal.Dialog className="sm:max-w-[420px]">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>
                                {isEditing ? "Edit Provider" : "Add Provider"}
                            </Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="space-y-4 p-2">
                            <div className="space-y-2">
                                <Select
                                    className="w-full"
                                    placeholder="Select a provider"
                                    selectedKey={provider?.id || ""}
                                    onSelectionChange={(key) => {
                                        const plugin = apiPlugins.find(p => p.info?.id === key);
                                        if (plugin) {
                                            onInputChange("id", plugin.info?.id || "");
                                            onInputChange("name", plugin.info?.name || "");
                                            onInputChange("url", (plugin as any).info?.url || (plugin as any).options?.url || (plugin as any).endpoint || "");
                                        }
                                    }}
                                    isDisabled={isEditing}
                                >
                                    <Label>Provider</Label>
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox>
                                            {apiPlugins.map((plugin) => (
                                                <ListBox.Item
                                                    key={plugin.info?.id}
                                                    id={plugin.info?.id}
                                                    textValue={plugin.info?.name}
                                                >
                                                    {plugin.info?.name}
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                            ))}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Input
                                    value={provider?.name || ""}
                                    onChange={(e) => onInputChange("name", e.target.value)}
                                    placeholder="Provider name"
                                    disabled={isEditing}
                                    variant="secondary"
                                    className={"w-full"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    value={provider?.url || ""}
                                    onChange={(e) => onInputChange("url", e.target.value)}
                                    placeholder="https://api.example.com"
                                    variant="secondary"
                                    className={"w-full"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    value={provider?.apiKey || ""}
                                    onChange={(e) => onInputChange("apiKey", e.target.value)}
                                    placeholder="sk-..."
                                    variant="secondary"
                                    className={"w-full"}
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
