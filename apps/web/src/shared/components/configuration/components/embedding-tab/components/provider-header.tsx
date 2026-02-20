import { Button, Tooltip, Switch } from "@heroui/react";
import { Edit2, Trash2 } from "lucide-react";
import type { EmbeddingProviderItem } from "@/shared/types/config";

interface ProviderHeaderProps {
    provider: EmbeddingProviderItem;
    onEdit: () => void;
    onDelete: () => void;
    onToggleEnabled: () => void;
}

export function ProviderHeader({
    provider,
    onEdit,
    onDelete,
    onToggleEnabled,
}: ProviderHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Switch
                    isSelected={provider.enabled}
                    onChange={onToggleEnabled}
                    size="sm"
                >
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                </Switch>
                <div>
                    <h4 className="text-sm font-medium">{provider.name}</h4>
                    <p className="text-xs text-muted truncate max-w-50">
                        {provider.url}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onPress={onEdit}>
                    <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onPress={onDelete} className="text-danger">
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}

