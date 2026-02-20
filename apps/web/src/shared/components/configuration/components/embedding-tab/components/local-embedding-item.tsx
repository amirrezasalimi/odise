import React from "react";
import { Card, Button, Spinner, Tooltip, Chip, Separator } from "@heroui/react";
import { Database, Play, Gauge, Info } from "lucide-react";
import clsx from "clsx";

interface LocalEmbeddingItemProps {
    pluginId: string;
    name: string;
    description?: string;
    isLoaded: boolean;
    isLoading: boolean;
    loadingProgress?: number;
    onLoad: () => void;
    onUnload: () => void;
    onBenchmark: () => void;
}

export const LocalEmbeddingItem = ({
    pluginId,
    name,
    description,
    isLoaded,
    isLoading,
    loadingProgress = 0,
    onLoad,
    onUnload,
    onBenchmark,
}: LocalEmbeddingItemProps) => {
    return (
        <Card variant="secondary">
            <Card.Content className="flex flex-row items-center justify-between gap-4">
                {/* Left: Indicator & Title */}
                <div className="flex items-center gap-2 w-1/3">
                    <span className={clsx("w-2 h-2 rounded-full shrink-0", isLoaded ? "bg-success" : "bg-muted")} />
                    <span className="truncate">{name}</span>
                    <Tooltip>
                        <Tooltip.Trigger>
                            <span className="cursor-help text-muted hover:text-foreground transition-colors">
                                <Info className="w-4 h-4" />
                            </span>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <div className="space-y-2 p-1">
                                <p className="text-[10px] font-bold uppercase text-muted">ID</p>
                                <p className="text-xs font-mono">{pluginId}</p>
                                {description && (
                                    <>
                                        <Separator />
                                        <p className="text-xs max-w-xs">{description}</p>
                                    </>
                                )}
                            </div>
                        </Tooltip.Content>
                    </Tooltip>
                </div>

                {/* Middle: Progress or Active Status */}
                <div className="flex-1 min-w-0 flex items-center justify-center">
                    {isLoading ? (
                        <div className="w-full max-w-xs flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-accent/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent transition-all duration-300"
                                    style={{ width: `${loadingProgress}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium text-muted shrink-0 min-w-8 text-right">
                                {Math.round(loadingProgress)}%
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {isLoaded && (
                                <>
                                    <Chip variant="soft" color="success" size="sm">
                                        Operational
                                    </Chip>
                                    <span className="text-xs font-medium text-success ml-2">WebGPU</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {isLoaded && !isLoading && (
                        <Button
                            size="sm"
                            variant="tertiary"
                            isIconOnly
                            onPress={onBenchmark}
                        >
                            <Gauge className="w-4 h-4" />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant={isLoaded ? "tertiary" : "primary"}
                        onPress={() => isLoaded ? onUnload() : onLoad()}
                        isDisabled={isLoading}
                    >
                        {isLoading ? (
                            <Spinner size="sm" color="current" />
                        ) : isLoaded ? (
                            "Eject"
                        ) : (
                            <span className="flex items-center gap-2">
                                <Play className="w-3.5 h-3.5 fill-current" />
                                Load
                            </span>
                        )}
                    </Button>
                </div>
            </Card.Content>
        </Card>
    );
};
