import { Card, Button, Select, ListBox, Spinner, Tooltip, Chip, Switch } from "@heroui/react";
import clsx from "clsx";
import React, { useEffect } from "react";
import { ArrowDownIcon } from "@/shared/components/icons/arrow-down";
import { HumanSpeakIcon } from "@/shared/components/icons/speak";
import { TrashIcon } from "lucide-react";
import { IconEdit } from "@tabler/icons-react";
import type { TTSProvider, TTSProviderVariant, TTSProviderSpeaker } from "@odise/types";

interface TTSItemProps {
    type: "local" | "api";
    id: string; // The specific instance ID
    pluginId: string; // The plugin type ID
    name: string;
    description?: string;

    // Local specific
    isLoaded?: boolean;
    isLoading?: boolean;
    loadingProgress?: number;
    instance?: TTSProvider;

    // API specific
    isEnabled?: boolean;
    config?: any;

    // Shared
    options?: any;
    variants: TTSProviderVariant[];
    speakers: TTSProviderSpeaker[];
    isTesting?: boolean;
    dataLoading?: Record<string, boolean>;

    onLoad?: (variantId?: string) => void;
    onUnload?: () => void;
    onUpdate?: (updates: any) => void;
    onDelete?: () => void;
    onLoadVariants?: () => void;
    onLoadSpeakers?: () => void;
    onTest?: (speakerId: string) => void;
}

const TTSItem = ({
    type,
    id,
    pluginId,
    name,
    description,
    isLoaded,
    isLoading,
    loadingProgress = 0,
    instance,
    isEnabled,
    config,
    options,
    variants,
    speakers,
    isTesting,
    dataLoading,
    onLoad,
    onUnload,
    onUpdate,
    onDelete,
    onLoadVariants,
    onLoadSpeakers,
    onTest,
}: TTSItemProps) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [selectedSpeaker, setSelectedSpeaker] = React.useState<string>("");
    const [selectedVariant, setSelectedVariant] = React.useState<string>(config?.selectedModelId || options?.defaultVariant || "");

    // Load variants by default if possible
    useEffect(() => {
        if (options?.hasVariants && variants.length === 0) {
            onLoadVariants?.();
        }
    }, [options?.hasVariants, variants.length]);

    // Load speakers when expanded if not loaded
    useEffect(() => {
        if (isExpanded && speakers.length === 0 && (isLoaded || type === "api")) {
            onLoadSpeakers?.();
        }
    }, [isExpanded, speakers.length, isLoaded]);

    const handleTest = () => {
        if (selectedSpeaker) {
            onTest?.(selectedSpeaker);
        }
    };

    const statusColor = (type === "local" ? isLoaded : isEnabled) ? "bg-success" : "bg-muted";

    return (
        <Card variant="secondary" className="overflow-hidden">
            <div className="flex items-start justify-between gap-2 p-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className={clsx("w-2 h-2 rounded-full", statusColor)} />
                        <Tooltip>
                            <Tooltip.Trigger>
                                <span className="text-base cursor-help">{name}</span>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                                <Tooltip.Arrow />
                                <div className="space-y-1">
                                    {description && <p className="text-sm">{description}</p>}
                                    <div className="flex font-mono text-xs text-muted">ID: {pluginId}</div>
                                </div>
                            </Tooltip.Content>
                        </Tooltip>

                        {(isLoaded || (type === "api" && isEnabled)) && (
                            <Button
                                variant="tertiary"
                                size="sm"
                                isIconOnly
                                onPress={() => setIsExpanded(!isExpanded)}
                                className="h-6 w-6 min-w-6"
                            >
                                <ArrowDownIcon
                                    className={clsx(
                                        "w-4 h-4 transition-transform duration-200",
                                        isExpanded ? "rotate-180" : ""
                                    )}
                                />
                            </Button>
                        )}
                    </div>

                    {/* Supported Languages */}
                    {options?.supportedLanguages && (
                        <div className="flex flex-wrap gap-1.5 pl-4">
                            {options.supportedLanguages.map((lang: string) => (
                                <Chip key={lang} size="sm" variant="soft" color="accent">
                                    {lang}
                                </Chip>
                            ))}
                        </div>
                    )}

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 pl-4">
                        {options?.supportChunking && <Chip size="sm" variant="tertiary">Chunking</Chip>}
                        {options?.supportVoiceCloning && <Chip size="sm" variant="tertiary">Voice Cloning</Chip>}
                        {options?.supportVoiceDesign && <Chip size="sm" variant="tertiary">Voice Design</Chip>}
                    </div>

                    {/* Speakers Section */}
                    {isExpanded && (
                        <div className="flex flex-col border-t gap-2 border-tertiary pt-2 mt-2">
                            <div className="flex gap-1 flex-row">
                                <span className="text-sm cursor-help">Speakers</span>
                                {dataLoading?.[`${id}_speakers`] && <Spinner size="sm" color="current" />}
                            </div>

                            {(() => {
                                const hasLangs = speakers.some((s: TTSProviderSpeaker) => s.lang);
                                if (!hasLangs) {
                                    return (
                                        <div className="flex flex-wrap gap-1.5 pl-4">
                                            {speakers.map((s) => (
                                                <div key={s.id} onClick={() => setSelectedSpeaker(s.id)} className="cursor-pointer">
                                                    <Chip size="sm" variant="soft" color={selectedSpeaker === s.id ? "accent" : "default"}>
                                                        {s.name}
                                                    </Chip>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }

                                const grouped = speakers.reduce((acc: Record<string, TTSProviderSpeaker[]>, s) => {
                                    const lang = s.lang || "Other";
                                    if (!acc[lang]) acc[lang] = [];
                                    acc[lang].push(s);
                                    return acc;
                                }, {});

                                return (
                                    <div className="flex flex-col gap-2 pl-4">
                                        {Object.entries(grouped).map(([lang, ls]) => (
                                            <div key={lang} className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-2 bg-accent rotate-45 rounded-sm" />
                                                    <span className="text-sm font-medium text-foreground">{lang}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {ls.map((s) => (
                                                        <div key={s.id} onClick={() => setSelectedSpeaker(s.id)} className="cursor-pointer">
                                                            <Chip size="sm" variant="soft" color={selectedSpeaker === s.id ? "accent" : "default"}>
                                                                {s.name}
                                                            </Chip>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            <div className="pl-4 pt-1 flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="tertiary"
                                    isDisabled={!selectedSpeaker || isTesting}
                                    onPress={handleTest}
                                    className="h-7 text-xs"
                                >
                                    {isTesting ? (
                                        <span className="flex items-center gap-2">
                                            <Spinner size="sm" color="current" />
                                            <span>Testing...</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5">
                                            <HumanSpeakIcon className="w-3.5 h-3.5" />
                                            <span>Test</span>
                                        </span>
                                    )}
                                </Button>
                                {type === "api" && (
                                    <Button variant="tertiary" size="sm" className="h-7 text-xs" onPress={() => onUpdate?.({ _customSpeakers: true })}>
                                        Custom Speakers
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {options?.hasVariants && (
                        <Select
                            className="w-48"
                            placeholder="Variant"
                            selectedKey={selectedVariant}
                            isDisabled={isLoading}
                            onSelectionChange={(key) => {
                                const val = String(key);
                                setSelectedVariant(val);
                                onUpdate?.({ selectedModelId: val });
                                if (type === "local" && isLoaded) onLoad?.(val);
                            }}
                        >
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
                                    {variants.map((v) => (
                                        <ListBox.Item key={v.id} id={v.id} textValue={v.name}>
                                            <div className="flex items-center justify-between gap-4">
                                                <span>{v.name}</span>
                                                {v.sizeMB && <span className="text-xs text-muted">{v.sizeMB} MB</span>}
                                            </div>
                                            {v.loaded && <ListBox.ItemIndicator />}
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Select.Popover>
                        </Select>
                    )}

                    {type === "local" ? (
                        <Button
                            variant={isLoaded ? "tertiary" : "primary"}
                            size="sm"
                            isDisabled={isLoading}
                            onPress={() => isLoaded ? onUnload?.() : onLoad?.(selectedVariant)}
                            className={clsx("relative", isLoaded ? "border border-white/50" : "")}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Spinner size="sm" color="current" />
                                    <span>{Math.round(loadingProgress)}%</span>
                                </span>
                            ) : isLoaded ? "Eject" : "Load"}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Switch
                                isSelected={isEnabled}
                                onChange={() => onUpdate?.({ enabled: !isEnabled })}
                                size="sm"
                            >
                                <Switch.Control>
                                    <Switch.Thumb />
                                </Switch.Control>
                            </Switch>
                            <Button variant="tertiary" size="sm" isIconOnly onPress={() => onUpdate?.({ _edit: true })}>
                                <IconEdit className="size-4 min-w-4" />
                            </Button>
                            <Button variant="danger" size="sm" isIconOnly onPress={onDelete}>
                                <TrashIcon className="size-4 min-w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default TTSItem;
