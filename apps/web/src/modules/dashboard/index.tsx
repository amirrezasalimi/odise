import { useQuery, useMutation } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { Link, useNavigate } from "@tanstack/react-router";
import { Card, Button } from "@heroui/react";
import { LINKS } from "@/shared/constants/links";
import { useState } from "react";
import { Plus, LayoutGrid, List } from "lucide-react";

type ViewMode = "card" | "list";

const Dashboard = () => {
    const notebooks = useQuery(api.apis.dashboard.getNotebooks);
    const createNotebook = useMutation(api.apis.dashboard.createNotebook);
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    const handleCreateNotebook = async () => {
        setIsCreating(true);
        try {
            const notebookId = await createNotebook({
                title: "New Notebook",
                emoji: "📓",
                description: "",
            });
            navigate({ to: LINKS.notebook(notebookId) });
        } catch (error) {
            console.error("Failed to create notebook:", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8">
            {/* Header with title and view toggle */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-semibold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        {notebooks?.length ?? 0} {notebooks?.length === 1 ? "notebook" : "notebooks"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        isIconOnly
                        variant={viewMode === "card" ? "secondary" : "ghost"}
                        size="sm"
                        onPress={() => setViewMode("card")}
                        aria-label="Card view"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                        isIconOnly
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        onPress={() => setViewMode("list")}
                        aria-label="List view"
                    >
                        <List className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {viewMode === "card" ? (
                /* Card View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Add Notebook Card */}
                    <div
                        onClick={!isCreating ? handleCreateNotebook : undefined}
                        className={`
                            h-full border-dashed border-2 hover:border-primary transition-all
                            cursor-pointer group min-h-[180px] flex items-center justify-center rounded-2xl
                            ${isCreating ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-lg'}
                        `}
                    >
                        <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium">
                                {isCreating ? "Creating..." : "New Notebook"}
                            </span>
                        </div>
                    </div>

                    {/* Notebook Cards */}
                    {notebooks?.map((notebook) => (
                        <Link
                            key={notebook._id}
                            to={LINKS.notebook(notebook._id)}
                            className="block"
                        >
                            <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group min-h-[180px]">
                                <Card.Content className="p-5 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl group-hover:scale-110 transition-transform">
                                            {notebook.emoji}
                                        </span>
                                        <h2 className="text-base font-semibold truncate flex-1">
                                            {notebook.title}
                                        </h2>
                                    </div>
                                    {notebook.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                                            {notebook.description}
                                        </p>
                                    )}
                                    <div className="mt-auto pt-3 text-xs text-muted-foreground">
                                        {(notebook as any).sourceCount ?? 0} sources
                                    </div>
                                </Card.Content>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="flex flex-col gap-3">
                    {/* Add Notebook Item */}
                    <div
                        onClick={!isCreating ? handleCreateNotebook : undefined}
                        className={`
                            w-full border-dashed border-2 hover:border-primary transition-all
                            cursor-pointer group h-16 flex items-center justify-center rounded-2xl
                            ${isCreating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/5'}
                        `}
                    >
                        <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <Plus className="w-4 h-4" />
                            </div>
                            <span className="font-medium">
                                {isCreating ? "Creating..." : "New Notebook"}
                            </span>
                        </div>
                    </div>

                    {/* Notebook List Items */}
                    {notebooks?.map((notebook) => (
                        <Link
                            key={notebook._id}
                            to={LINKS.notebook(notebook._id)}
                            className="block"
                        >
                            <Card className="hover:shadow-md hover:-translate-x-1 transition-all cursor-pointer group">
                                <Card.Content className="p-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl group-hover:scale-110 transition-transform">
                                            {notebook.emoji}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-base font-semibold truncate">
                                                {notebook.title}
                                            </h2>
                                            {notebook.description && (
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                                    {notebook.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground shrink-0">
                                            {(notebook as any).sourceCount ?? 0} sources
                                        </div>
                                    </div>
                                </Card.Content>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {notebooks && notebooks.length === 0 && (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                        <Plus className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No notebooks yet</h3>
                    <p className="text-muted-foreground">
                        Click "New Notebook" to create your first one.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
