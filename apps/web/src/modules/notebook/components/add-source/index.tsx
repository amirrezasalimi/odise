import {
    Modal,
    Button,
    Tabs,
    TextArea,
} from "@heroui/react";
import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import pdf2md from "@opendocsg/pdf2md";
import { estimateTokenCount } from "tokenx";
import { toast } from "sonner";
import { IconUpload, IconFileText, IconLoader2, IconX } from "@tabler/icons-react";

/**
 * Converts markdown content to plain text while preserving spacing.
 * Strips headers, bold, italics, links, images, code blocks, and list prefixes.
 */
const markdownToText = (md: string) => {
    return md
        .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments like <!-- PAGE_BREAK -->
        .replace(/^#+\s+/gm, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
        .replace(/!\[(.*?)\]\(.*?\)/g, '$1') // Remove images
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .replace(/^>\s+/gm, '') // Remove quotes
        .replace(/^\s*[-*+]\s+/gm, '') // Remove list bullets
        .replace(/^\s*\d+\.\s+/gm, ''); // Remove numbered lists
};

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
                const md = await pdf2md(new Uint8Array(arrayBuffer));
                extractedText = markdownToText(md);
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
        if (!rawText.trim()) {
            toast.error("Please provide some text");
            return;
        }

        setIsUploading(true);
        try {
            const tokensCount = estimateTokenCount(rawText);

            // Generate a name from the first line or use a default
            const lines = rawText.trim().split('\n');
            const firstLine = lines.find(l => l.trim().length > 0) || "Pasted Text";
            const name = firstLine.length > 50
                ? firstLine.slice(0, 47).trim() + "..."
                : firstLine;

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
                name,
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
