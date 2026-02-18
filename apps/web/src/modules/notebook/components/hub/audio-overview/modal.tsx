import { Modal, Button } from "@heroui/react";

interface AudioOverviewModalProps {
    open: boolean;
    onClose: () => void;
}

const AudioOverviewModal = ({ open, onClose }: AudioOverviewModalProps) => {
    return (
        <Modal isOpen={open} onOpenChange={onClose}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="sm:max-w-2xl h-100">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>Audio Overview</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <p>This is a simple modal content for audio overview.</p>
                        </Modal.Body>
                        <Modal.Footer className="justify-end">
                            <Button>
                                Generate
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
};

export default AudioOverviewModal;
