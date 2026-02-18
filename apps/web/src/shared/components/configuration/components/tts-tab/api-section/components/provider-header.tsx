import { Button, Tooltip, Switch, Chip } from "@heroui/react";
import clsx from "clsx";
import { ArrowDownIcon } from "@/shared/components/icons/arrow-down";
import { TrashIcon } from "lucide-react";
import { IconEdit } from "@tabler/icons-react";
import type { TTSProvider, TTSProviderSpeaker, TTSProviderVariant } from "@odise/types";
import type { ApiTTSProviderItem } from "@/shared/types/config";
import { ProviderModelSelector } from "./provider-model-selector";

interface ProviderHeaderProps {
    provider: ApiTTSProviderItem & {
        speakers?: TTSProviderSpeaker[];
        errorLoadingSpeakers?: boolean;
        variants?: TTSProviderVariant[];
    };
    plugin: TTSProvider | undefined;
    expandedSpeakers: Record<string, boolean>;
    selectedSpeakerId: string | undefined;
    onToggleSpeakers: (providerId: string) => void;
    onEdit: () => void;
    onDelete: () => void;
    onToggleEnabled: () => void;
    onVariantChange: (key: React.Key | null) => void;
}

export function ProviderHeader({
    provider,
    plugin,
    expandedSpeakers,
    selectedSpeakerId,
    onToggleSpeakers,
    onEdit,
    onDelete,
    onToggleEnabled,
    onVariantChange,
}: ProviderHeaderProps) {
    const hasError = provider.errorLoadingSpeakers || false;
    const combinedSpeakersCount = (provider.speakers?.length || 0) + (provider.customSpeakers?.length || 0);

    // Find selected speaker (from API speakers or custom speakers)
    const selectedSpeaker = selectedSpeakerId
        ? provider.speakers?.find(s => s.id === selectedSpeakerId) ||
        (selectedSpeakerId.startsWith('custom-')
            ? { id: selectedSpeakerId, name: provider.customSpeakers?.[parseInt(selectedSpeakerId.split('-')[1])] }
            : undefined)
        : undefined;

    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                {/* Status indicator */}
                <span className={`w-2 h-2 rounded-full ${provider.enabled ? 'bg-success' : 'bg-muted'}`} />
                {/* Error indicator */}
                {hasError && (
                    <Tooltip>
                        <Tooltip.Trigger>
                            <span className="text-danger text-xs cursor-help">⚠️ Failed to load speakers</span>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <Tooltip.Arrow />
                            <p className="text-sm">Failed to load speakers for this provider. Check your API key and URL configuration, then edit the provider to retry.</p>
                        </Tooltip.Content>
                    </Tooltip>
                )}
                <Tooltip>
                    <Tooltip.Trigger>
                        <span className="text-base cursor-help">{provider.name || plugin?.info?.name}</span>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        <div className="space-y-1">
                            {plugin?.info?.description && (
                                <p className="text-sm">{plugin.info.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-muted">
                                {plugin?.info?.version && (
                                    <span>v{plugin.info.version}</span>
                                )}
                                {plugin?.info?.author && (
                                    <span>by {plugin.info.author}</span>
                                )}
                            </div>
                        </div>
                    </Tooltip.Content>
                </Tooltip>
                {/* Selected speaker chip */}
                {selectedSpeaker && (
                    <Chip size="sm" variant="soft" className="text-xs">
                        {selectedSpeaker.name}
                    </Chip>
                )}
                {/* Speakers toggle button */}
                {provider.enabled && combinedSpeakersCount > 0 && (
                    <Button
                        variant="tertiary"
                        size="sm"
                        isIconOnly
                        onPress={() => onToggleSpeakers(provider.uid)}
                        className="h-6 w-6 min-w-6"
                    >
                        <ArrowDownIcon
                            className={clsx(
                                "w-4 h-4 transition-transform duration-200",
                                expandedSpeakers[provider.uid] ? "rotate-180" : ""
                            )}
                        />
                    </Button>
                )}
                {/* Model autocomplete */}
                {plugin?.options?.hasVariants && provider.enabled && provider.variants && provider.variants.length > 0 && (
                    <ProviderModelSelector
                        provider={provider}
                        onVariantChange={onVariantChange}
                    />
                )}
            </div>
            {/* Switch + edit + trash */}
            <div className="flex items-center gap-2">
                <Switch
                    isSelected={provider.enabled}
                    onChange={onToggleEnabled}
                    size="sm"
                >
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                </Switch>
                <Button
                    variant="tertiary"
                    size="sm"
                    isIconOnly
                    onPress={onEdit}
                >
                    <IconEdit className="size-4 min-w-4" />
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    isIconOnly
                    onPress={onDelete}
                >
                    <TrashIcon className="size-4 min-w-4" />
                </Button>
            </div>
        </div>
    );
}
