import { Modal, Button, Label, TextArea } from "@heroui/react";
import type { ApiTTSProviderItem } from "@/shared/types/config";
import React from "react";

interface CustomSpeakersModalProps {
    isOpen: boolean;
    provider: ApiTTSProviderItem | null;
    customSpeakersText: string;
    onOpenChange: (open: boolean) => void;
    onSave: () => void;
    onTextChange: (text: string) => void;
}

const CustomSpeakersModal = ({
    isOpen,
    provider,
    customSpeakersText,
    onOpenChange,
    onSave,
    onTextChange,
}: CustomSpeakersModalProps) => {
    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
                <Modal.Container>
                    <Modal.Dialog className="sm:max-w-105">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>
                                Set Custom Speakers
                            </Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="space-y-4 p-2">
                            <div className="space-y-2 flex gap-1 flex-col">
                                <Label>Custom Speakers (one per line)</Label>
                                <TextArea
                                    value={customSpeakersText}
                                    variant="secondary"
                                    onChange={(e) => onTextChange(e.target.value)}
                                    placeholder="Speaker 1&#10;Speaker 2&#10;Speaker 3"
                                    className="w-full min-h-50"
                                />
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onPress={onSave}>
                                Save
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
};

export default CustomSpeakersModal;
