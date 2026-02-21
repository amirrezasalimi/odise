import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import pdf2md from "@opendocsg/pdf2md";
import { estimateTokenCount } from "tokenx";
import { toast } from "sonner";
import useEmbedding from "@/shared/hooks/embedding";
import { CONFIG_KEYS } from "@/shared/constants/config";

/**
 * Converts markdown content to plain text while preserving spacing.
 * Strips headers, bold, italics, links, images, code blocks, and list prefixes.
 */
const markdownToText = (md: string) => {
    return md
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/^>\s+/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '');
};

// ── Embedding chunking config ─────────────────────────────────────────────────
// Tweak these constants to experiment with different chunking strategies.
const EMBEDDING_CHUNK_CONFIG = {
    /** Target number of sentences per chunk. */
    sentencesPerChunk: 35,
    /** Overlap: how many sentences from the previous chunk to prepend. */
    overlapSentences: 6,
    /** Max chars per chunk — hard safety limit; splits further if exceeded. */
    maxCharsPerChunk: 4000,
} as const;

/** Split text into sentence-boundary chunks with overlap. */
const chunkBySentences = (text: string): string[] => {
    const { sentencesPerChunk, overlapSentences, maxCharsPerChunk } = EMBEDDING_CHUNK_CONFIG;

    // Split on sentence-ending punctuation followed by whitespace
    const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) ?? [text];
    const chunks: string[] = [];

    for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
        const start = Math.max(0, i - overlapSentences);
        const slice = sentences.slice(start, i + sentencesPerChunk).join("").trim();
        if (!slice) continue;
        // If a chunk is still too long, hard-split it
        if (slice.length > maxCharsPerChunk) {
            for (let j = 0; j < slice.length; j += maxCharsPerChunk) {
                const sub = slice.slice(j, j + maxCharsPerChunk).trim();
                if (sub) chunks.push(sub);
            }
        } else {
            chunks.push(slice);
        }
    }
    return chunks.length ? chunks : [text.slice(0, maxCharsPerChunk)];
};

// ── Toast progress helpers ────────────────────────────────────────────────────
const progressHub = new Map<string, (done: number) => void>();

export const EmbedProgress = ({ sourceId, total }: { sourceId: string; total: number }) => {
    const [done, setDone] = useState(0);

    useEffect(() => {
        progressHub.set(sourceId, setDone);
        return () => { progressHub.delete(sourceId); };
    }, [sourceId]);

    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return (
        <div style={{ marginTop: 4 }
        }>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                <span>{done} / {total} chunks </span>
                < span > {pct} % </span>
            </div>
            < div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                <div
                    style={
                        {
                            height: "100%",
                            width: `${pct}%`,
                            background: "rgba(255,255,255,0.85)",
                            borderRadius: 4,
                            transition: "width 0.3s ease",
                        }
                    }
                />
            </div>
        </div>
    );
};

interface UseAddSourceProps {
    notebookId: any;
    onClose: () => void;
}

export const useAddSource = ({ notebookId, onClose }: UseAddSourceProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const [rawText, setRawText] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateUploadUrl = useMutation(api.apis.notebook.generateUploadUrl);
    const createSource = useMutation(api.apis.notebook.createSource);
    const preSaveChunks = useMutation(api.apis.notebook.preSaveChunks);
    const setChunkProcessing = useMutation(api.apis.notebook.setChunkProcessing);
    const setChunkComplete = useMutation(api.apis.notebook.setChunkComplete);
    const markSourceEmbedded = useMutation(api.apis.notebook.markSourceEmbedded);

    const enableSourcesEmbedding = useQuery(api.apis.config.getConfig, {
        key: CONFIG_KEYS.enable_sources_embedding,
    });
    const isEmbeddingEnabled =
        enableSourcesEmbedding === true || enableSourcesEmbedding === "true";

    const { getProviders, getProvider } = useEmbedding();

    // ── Embedding pipeline ──────────────────────────────────────────────────
    const runEmbedding = async (sourceId: string, text: string) => {
        const providers = await getProviders(true);
        console.log("providers", providers);


        const provider = providers.find((p) => p.config?.enabled !== false);
        if (!provider) return; // no enabled provider — skip silently

        // Get the provider (this will load it if needed)
        const resolved = await getProvider(provider.id, true);
        if (!resolved) return;

        const chunks = chunkBySentences(text);
        const total = chunks.length;

        const processPromise = (async () => {
            // 1. Pre-insert all chunks as "pending" — returns IDs in order
            const chunkIds = await preSaveChunks({
                notebookSourceId: sourceId as any,
                chunks: chunks.map((content, i) => ({
                    content,
                    chunkIndex: i,
                    tokenCount: estimateTokenCount(content),
                })),
            });

            // 2. Process each chunk: pending → processing → complete
            let done = 0;
            for (let i = 0; i < chunks.length; i++) {
                const chunkId = chunkIds[i] as any;

                await setChunkProcessing({ chunkId });

                const result = await resolved.instance.embed(chunks[i]);

                await setChunkComplete({ chunkId, embedding: result.embedding });

                done++;
                progressHub.get(sourceId)?.(done);
            }

            // 3. Finalise source
            await markSourceEmbedded({ sourceId: sourceId as any });

            return total;
        })();

        const toastId = toast.loading("Embedding source…", {
            description: <EmbedProgress sourceId={sourceId} total={total} />,
        });

        try {
            const total = await processPromise;
            toast.success("Embedding complete", {
                id: toastId,
                description: `${total} chunks embedded and saved.`,
            });
        } catch (err) {
            console.error("Embedding error:", err);
            toast.error("Embedding failed", {
                id: toastId,
                description: "Could not embed source. Check console for details.",
            });
        }
    };

    // ── File upload handler ─────────────────────────────────────────────────
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

            const sourceId = await createSource({
                notebookId,
                name: fileName,
                type,
                originalFileStorageId,
                rawContentStorageId,
                tokensCount,
            });

            toast.success("Source added successfully");
            onClose();
            resetForm();


            // Fire-and-forget embedding (runs after modal closes)
            if (isEmbeddingEnabled && sourceId) {
                runEmbedding(sourceId as string, extractedText);
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload source");
        } finally {
            setIsUploading(false);
        }
    };

    // ── Raw text handler ────────────────────────────────────────────────────
    const handleAddRawText = async () => {
        if (!rawText.trim()) {
            toast.error("Please provide some text");
            return;
        }

        setIsUploading(true);
        try {
            const tokensCount = estimateTokenCount(rawText);

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

            const sourceId = await createSource({
                notebookId,
                name,
                type: "raw",
                rawContentStorageId,
                tokensCount,
            });

            toast.success("Source added successfully");
            onClose();
            resetForm();

            if (isEmbeddingEnabled && sourceId) {
                runEmbedding(sourceId as string, rawText);
            }
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

    return {
        isUploading,
        rawText,
        setRawText,
        fileInputRef,
        handleFileUpload,
        handleAddRawText,
    };
};
