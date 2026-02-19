import {
    Modal,
    Button,
    Input,
    Label,
    Tabs,
    TextArea,
} from "@heroui/react";
import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { extractText, getDocumentProxy } from "unpdf";
import { estimateTokenCount } from "tokenx";
import { toast } from "sonner";
import { IconUpload, IconFileText, IconLoader2, IconX } from "@tabler/icons-react";

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
    const [isUploading, setIsUploading] = useState(false);
    const [rawText, setRawText] = useState("");
    const [sourceName, setSourceName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateUploadUrl = useMutation(api.apis.notebook.generateUploadUrl);
    const createSource = useMutation(api.apis.notebook.createSource);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileName = file.name;
            const fileType = file.type;
            let type = "txt";
            if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
                type = "pdf";
            }

            const arrayBuffer = await file.arrayBuffer();
            let extractedText = "";

            if (type === "pdf") {
                const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
                const result = await extractText(pdf, { mergePages: true });
                extractedText = result.text;
            } else {
                extractedText = new TextDecoder().decode(arrayBuffer);
            }

            const tokensCount = estimateTokenCount(extractedText);

            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId: originalFileStorageId } = await result.json();

            const textBlob = new Blob([extractedText], { type: "text/plain" });
            const textUploadUrl = await generateUploadUrl();
            const textResult = await fetch(textUploadUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: textBlob,
            });
            const { storageId: rawContentStorageId } = await textResult.json();

            await createSource({
                notebookId,
                name: fileName,
                type,
                originalFileStorageId,
                rawContentStorageId,
                tokensCount,
            });

            toast.success("Source added successfully");
            onOpenChange(false);
            resetForm();
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload source");
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddRawText = async () => {
        if (!rawText.trim() || !sourceName.trim()) {
            toast.error("Please provide a name and some text");
            return;
        }

        setIsUploading(true);
        try {
            const tokensCount = estimateTokenCount(rawText);

            const textBlob = new Blob([rawText], { type: "text/plain" });
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: textBlob,
            });
            const { storageId: rawContentStorageId } = await result.json();

            await createSource({
                notebookId,
                name: sourceName,
                type: "raw",
                rawContentStorageId,
                tokensCount,
            });

            toast.success("Source added successfully");
            onOpenChange(false);
            resetForm();
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to add source");
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setRawText("");
        setSourceName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

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
                        </Modal.Header>
                        <Modal.Body className="p-4">
                            <Tabs
                                variant="secondary"
                                selectedKey={activeTab}
                                onSelectionChange={(key) => setActiveTab(key as string)}
                            >
                                <Tabs.List className="mb-4">
                                    <Tabs.Tab id="upload">
                                        <div className="flex items-center gap-2">
                                            <IconUpload className="size-4" />
                                            <span>Upload</span>
                                        </div>
                                    </Tabs.Tab>
                                    <Tabs.Tab id="text">
                                        <div className="flex items-center gap-2">
                                            <IconFileText className="size-4" />
                                            <span>Raw Text</span>
                                        </div>
                                    </Tabs.Tab>
                                </Tabs.List>

                                <Tabs.Panel id="upload">
                                    <button
                                        type="button"
                                        className="w-full border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/5 transition-colors min-h-50"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".pdf,.txt"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                        {isUploading ? (
                                            <IconLoader2 className="size-10 animate-spin text-accent" />
                                        ) : (
                                            <IconUpload className="size-10 text-muted-foreground" />
                                        )}
                                        <p className="mt-4 font-medium">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            PDF or TXT files supported
                                        </p>
                                    </button>
                                </Tabs.Panel>

                                <Tabs.Panel id="text" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="source-name">Source Name</Label>
                                        <Input
                                            id="source-name"
                                            placeholder="My notes"
                                            value={sourceName}
                                            onChange={(e) => setSourceName(e.target.value)}
                                            variant="secondary"
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="raw-text">Content</Label>
                                        <TextArea
                                            id="raw-text"
                                            placeholder="Paste your text here..."
                                            value={rawText}
                                            onChange={(e) => setRawText(e.target.value)}
                                            variant="secondary"
                                            className="w-full"
                                            rows={6}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        variant="primary"
                                        onPress={handleAddRawText}
                                        isPending={isUploading}
                                    >
                                        Add Text Source
                                    </Button>
                                </Tabs.Panel>
                            </Tabs>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
};
