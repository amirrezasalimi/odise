import { Button, Tooltip, Switch, Label, Chip } from "@heroui/react";
import { TrashIcon } from "lucide-react";
import { IconEdit } from "@tabler/icons-react";
import type { ApiLLMProviderItem } from "@/shared/types/config";

interface ProviderHeaderProps {
    provider: ApiLLMProviderItem;
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
    const selectedModel = provider.models?.find(m => m.id === provider.selectedModelId);

    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                {/* Status indicator */}
                <span className={`w-2 h-2 rounded-full ${provider.enabled ? 'bg-success' : 'bg-muted'}`} />
                {/* Provider name */}
                <Tooltip>
                    <Tooltip.Trigger>
                        <span className="text-base cursor-help">{provider.name}</span>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        <div className="space-y-1">
                            <p className="text-sm">LLM Provider</p>
                            <p className="text-xs text-muted">{provider.url}</p>
                        </div>
                    </Tooltip.Content>
                </Tooltip>
                {/* Selected model chip */}
                {selectedModel && (
                    <Chip size="sm" variant="soft" className="text-xs">
                        {selectedModel.name}
                    </Chip>
                )}
            </div>
            <div className="flex items-center gap-2">
                {/* Enable/Disable Switch */}
                <Switch
                    isSelected={provider.enabled}
                    onChange={onToggleEnabled}
                    size="sm"
                >
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                </Switch>
                {/* Edit button */}
                <Button
                    variant="tertiary"
                    size="sm"
                    isIconOnly
                    onPress={onEdit}
                    className="h-7 w-7 min-w-7"
                >
                    <IconEdit className="w-4 h-4" />
                </Button>
                {/* Delete button */}
                <Button
                    variant="tertiary"
                    size="sm"
                    isIconOnly
                    onPress={onDelete}
                    className="h-7 w-7 min-w-7 text-danger hover:text-danger"
                >
                    <TrashIcon className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
