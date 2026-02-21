import {
    Modal,
    Button,
    Tabs,
    TextArea,
} from "@heroui/react";
import { useState } from "react";
import { IconUpload, IconFileText, IconLoader2, IconX } from "@tabler/icons-react";
import { useAddSource } from "./hooks/add-source";

interface AddSourceModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    notebookId: any;
}

export const AddSourceModal = ({
    isOpen,
    onOpenChange,
    notebookId,
}: AddSourceModalProps) => {
    const [activeTab, setActiveTab] = useState<string>("upload");

    const {
        isUploading,
        rawText,
        setRawText,
        fileInputRef,
        handleFileUpload,
        handleAddRawText,
    } = useAddSource({
        notebookId,
        onClose: () => onOpenChange(false),
    });

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
                <Modal.Container size="md">
                    <Modal.Dialog>
                        <Modal.CloseTrigger>
                            <IconX className="size-4" />
                        </Modal.CloseTrigger>
                        <Modal.Header>
                            <Modal.Heading>Add Source</Modal.Heading>
                            <p className="text-xs text-muted-foreground/60 mt-1 font-normal">
                                Add a document or paste text to your notebook.
                            </p>
                        </Modal.Header>
                        <Modal.Body>
                            <Tabs
                                variant="primary"
                                selectedKey={activeTab}
                                onSelectionChange={(key) => setActiveTab(key as string)}
                                className="w-full"
                            >
                                <Tabs.List className="mb-1">
                                    <Tabs.Tab id="upload">
                                        <div className="flex items-center gap-2">
                                            <IconUpload className="size-4" />
                                            <span>Upload File</span>
                                        </div>
                                    </Tabs.Tab>
                                    <Tabs.Tab id="text">
                                        <div className="flex items-center gap-2">
                                            <IconFileText className="size-4" />
                                            <span>Raw Text</span>
                                        </div>
                                    </Tabs.Tab>
                                </Tabs.List>

                                <Tabs.Panel id="upload" className="outline-none">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        className="relative group w-full aspect-4/3 max-h-60 border border-dashed border-border/40 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-all duration-300"
                                        onClick={() => !isUploading && fileInputRef.current?.click()}
                                        onKeyDown={(e) => e.key === 'Enter' && !isUploading && fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".pdf,.txt"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />

                                        <div className="p-4 rounded-full bg-accent/5 group-hover:bg-accent/10 transition-colors mb-4">
                                            {isUploading ? (
                                                <IconLoader2 className="size-8 animate-spin text-accent" />
                                            ) : (
                                                <IconUpload className="size-8 text-muted-foreground/60 group-hover:text-accent transition-colors" />
                                            )}
                                        </div>

                                        <div className="text-center">
                                            <p className="font-medium text-sm mb-1 text-foreground">
                                                {isUploading ? "Processing source..." : "Click to upload or drag & drop"}
                                            </p>
                                            <p className="text-xs text-muted-foreground/60">
                                                Supports PDF and TXT files
                                            </p>
                                        </div>
                                    </div>
                                </Tabs.Panel>

                                <Tabs.Panel id="text" className="outline-none">
                                    <div className="flex flex-col gap-4">
                                        <TextArea
                                            id="raw-text"
                                            aria-label="Paste raw text"
                                            placeholder="Paste your notes or text here..."
                                            value={rawText}
                                            onChange={(e) => setRawText(e.target.value)}
                                            variant="secondary"
                                            className="w-full min-h-55 font-sans text-sm"
                                            rows={12}
                                        />
                                        <Button
                                            className="w-full"
                                            variant="primary"
                                            onPress={handleAddRawText}
                                            isPending={isUploading}
                                        >
                                            Add Text Source
                                        </Button>
                                    </div>
                                </Tabs.Panel>
                            </Tabs>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
};
