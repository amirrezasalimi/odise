import React, { useEffect, useState } from "react";
import { Modal, Button, Input, Select, Label, ListBox } from "@heroui/react";
import type { ApiTTSProviderItem } from "@/shared/types/config";

interface AddProviderModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    pluginTypes: any[];
    onAdd: (pluginId: string, name: string, url: string, apiKey: string) => Promise<void>;
    editProvider?: ApiTTSProviderItem | null;
    onUpdate?: (id: string, updates: Partial<ApiTTSProviderItem>) => Promise<void>;
}

const AddProviderModal = ({
    isOpen,
    onOpenChange,
    pluginTypes,
    onAdd,
    editProvider,
    onUpdate
}: AddProviderModalProps) => {
    const [selectedPluginId, setSelectedPluginId] = useState("");
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [apiKey, setApiKey] = useState("");

    useEffect(() => {
        if (editProvider) {
            setSelectedPluginId(editProvider.pluginId);
            setName(editProvider.name);
            setUrl(editProvider.url);
            setApiKey(editProvider.apiKey);
        } else if (isOpen && pluginTypes.length > 0) {
            const first = pluginTypes[0];
            const inst = new first() as any;
            setSelectedPluginId(inst.info.id);
            setName(inst.info.name || "");
            setUrl(inst.options?.url || inst.info?.url || "");
            setApiKey("");
        } else {
            setSelectedPluginId("");
            setName("");
            setUrl("");
            setApiKey("");
        }
    }, [editProvider, isOpen]);

    const handleSave = async () => {
        if (editProvider && onUpdate) {
            await onUpdate(editProvider.id, { name, url, apiKey });
        } else if (selectedPluginId) {
            await onAdd(selectedPluginId, name, url, apiKey);
        }
        onOpenChange(false);
    };

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
                <Modal.Container>
                    <Modal.Dialog className="sm:max-w-105">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>
                                {editProvider ? "Edit Provider" : "Add Provider"}
                            </Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="space-y-4 p-2">
                            <div className="space-y-2">
                                <Select
                                    className="w-full"
                                    placeholder="Select a provider"
                                    selectedKey={selectedPluginId}
                                    onSelectionChange={(key) => {
                                        const pid = String(key);
                                        if (!pid || pid === "null" || pid === "undefined") return;
                                        setSelectedPluginId(pid);
                                        const pluginClass = pluginTypes.find((p: any) => {
                                            try { return (new p() as any).info.id === pid; } catch { return false; }
                                        });
                                        if (pluginClass) {
                                            const inst = new pluginClass() as any;
                                            setName(inst.info.name || "");
                                            setUrl(inst.options?.url || inst.info?.url || "");
                                        }
                                    }}
                                    isDisabled={!!editProvider}
                                >
                                    <Label>Provider</Label>
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox>
                                            {pluginTypes.map((p: any) => {
                                                const info = (new p() as any).info;
                                                return (
                                                    <ListBox.Item
                                                        key={info.id}
                                                        id={info.id}
                                                        textValue={info.name}
                                                    >
                                                        {info.name}
                                                        <ListBox.ItemIndicator />
                                                    </ListBox.Item>
                                                );
                                            })}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Provider name"
                                    variant="secondary"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://api.example.com"
                                    variant="secondary"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
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
                            <Button
                                variant="primary"
                                onPress={handleSave}
                                isDisabled={!name || (!editProvider && !selectedPluginId)}
                            >
                                {editProvider ? "Save" : "Add"}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
};

export default AddProviderModal;
