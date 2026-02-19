import { Button, Card, Popover, Spinner } from "@heroui/react";
import {
    IconPlus,
    IconFileText,
    IconFileTypePdf,
    IconFileDescription,
    IconChevronDown,
    IconChevronUp,
    IconTrash
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { AddSourceModal } from "./add-source";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";

const SourceItem = ({ source }: { source: any }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [content, setContent] = useState<string | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const rawContentUrl = useQuery(api.apis.notebook.getRawContentUrl, {
        storageId: source.rawContentStorageId
    });
    const deleteSource = useMutation(api.apis.notebook.deleteSource);

    useEffect(() => {
        if (isExpanded && !content && rawContentUrl) {
            setIsLoadingContent(true);
            fetch(rawContentUrl)
                .then(res => res.text())
                .then(text => setContent(text))
                .catch(err => {
                    console.error("Failed to load content", err);
                    toast.error("Failed to load source content");
                })
                .finally(() => setIsLoadingContent(false));
        }
    }, [isExpanded, content, rawContentUrl]);

    const getIcon = (type: string) => {
        switch (type) {
            case "pdf": return <IconFileTypePdf className="size-4 text-red-500" />;
            case "txt": return <IconFileText className="size-4 text-blue-500" />;
            case "raw": return <IconFileDescription className="size-4 text-emerald-500" />;
            default: return <IconFileText className="size-4" />;
        }
    };

    const handleDelete = async () => {
        try {
            await deleteSource({ sourceId: source._id });
            toast.success("Source removed");
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to remove source");
        }
    };

    return (
        <div
            className="group flex flex-col gap-0 rounded-2xl  hover:bg-white dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-border/40 hover:shadow-sm overflow-hidden"
        >
            <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-border/10">
                    {getIcon(source.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate mb-0.5">
                        {source.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                        {Math.round(source.tokensCount).toLocaleString()} tokens
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    <Popover>
                        <Popover.Trigger>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="tertiary"
                                className="opacity-0 group-hover:opacity-100"
                                onPress={(e) => e.continuePropagation()}
                            >
                                <IconTrash className="size-4" />
                            </Button>
                        </Popover.Trigger>
                        <Popover.Content>
                            <Popover.Dialog className="w-48">
                                <Popover.Heading>Remove source?</Popover.Heading>
                                <p className="text-xs text-muted-foreground mb-3">This action cannot be undone.</p>
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="tertiary">Cancel</Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onPress={handleDelete}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </Popover.Dialog>
                        </Popover.Content>
                    </Popover>

                    <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors p-1">
                        {isExpanded ? <IconChevronUp className="size-4" /> : <IconChevronDown className="size-4" />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-border/5">
                    <div className="bg-white/50 dark:bg-zinc-900/50 rounded-xl p-3 mt-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {isLoadingContent ? (
                            <div className="flex justify-center py-4">
                                <Spinner size="sm" color="current" />
                            </div>
                        ) : (
                            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-muted-foreground">
                                {content || "No content found."}
                            </pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Sources = () => {
    // Get notebookId from route params
    const { id: notebookId } = useParams({ from: '/notebook/$id' });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch sources for this notebook
    const sources = useQuery(api.apis.notebook.listSources, { notebookId });

    return (
        <Card className="w-4/12 h-full">
            <Card.Content className="h-full flex flex-col">
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-muted">
                            Sources
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                            {sources?.length || 0} items
                        </span>
                    </div>

                    <div className="h-px w-full bg-border/40 mb-4" />

                    <Button
                        className={"mb-6 w-full"}
                        variant="secondary"
                        onPress={() => setIsAddModalOpen(true)}
                    >
                        <IconPlus className="size-4" />
                        Add source
                    </Button>

                    <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                        {sources?.map((source) => (
                            <SourceItem key={source._id} source={source} />
                        ))}

                        {sources === undefined && (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-14 w-full bg-border/20 animate-pulse rounded-2xl" />
                                ))}
                            </div>
                        )}

                        {sources?.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                                <IconFileText className="size-10 mb-2 stroke-[1.5]" />
                                <p className="text-xs">No sources added yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card.Content>

            <AddSourceModal
                isOpen={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                notebookId={notebookId}
            />
        </Card>
    );
}

export default Sources;