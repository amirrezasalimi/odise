import { Button, Card, CardContent } from "@heroui/react";
import { IconPlus, IconFileText, IconFileTypePdf, IconFileDescription, IconDotsVertical } from "@tabler/icons-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { AddSourceModal } from "./add-source";
import { useParams } from "@tanstack/react-router";

const Sources = () => {
    // Get notebookId from route params
    const { id: notebookId } = useParams({ from: '/notebook/$id' });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch sources for this notebook
    const sources = useQuery(api.apis.notebook.listSources, { notebookId });

    const getIcon = (type: string) => {
        switch (type) {
            case "pdf": return <IconFileTypePdf className="size-4 text-red-500" />;
            case "txt": return <IconFileText className="size-4 text-blue-500" />;
            case "raw": return <IconFileDescription className="size-4 text-emerald-500" />;
            default: return <IconFileText className="size-4" />;
        }
    };

    return (
        <Card className="w-3/12 h-full">
            <CardContent className="h-full flex flex-col">
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
                            <div
                                key={source._id}
                                className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer border border-transparent hover:border-border/40 hover:shadow-sm"
                            >
                                <div className="p-2 rounded-xl bg-accent/5 transition-colors group-hover:bg-white dark:group-hover:bg-zinc-900 border border-transparent group-hover:border-border/10">
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
                                <Button isIconOnly size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 rounded-lg">
                                    <IconDotsVertical className="size-4 text-muted-foreground" />
                                </Button>
                            </div>
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
            </CardContent>

            <AddSourceModal
                isOpen={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                notebookId={notebookId}
            />
        </Card>
    );
}

export default Sources;