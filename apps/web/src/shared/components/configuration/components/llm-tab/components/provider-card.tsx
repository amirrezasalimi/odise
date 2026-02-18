import { Card, Button, Tooltip, Spinner, Chip } from "@heroui/react";
import { TestTube2, Database } from "lucide-react";
import type { ApiLLMProviderItem } from "@/shared/types/config";
import { ProviderHeader } from "./provider-header";

interface ProviderCardProps {
    provider: ApiLLMProviderItem;
    onEdit: () => void;
    onDelete: () => void;
    onToggleEnabled: () => void;
    onTest: () => void;
    onOpenModels: () => void;
    isTesting: boolean;
    testResult?: { success: boolean; message: string };
}

export function ProviderCard({
    provider,
    onEdit,
    onDelete,
    onToggleEnabled,
    onTest,
    onOpenModels,
    isTesting,
    testResult,
}: ProviderCardProps) {
    const selectedModel = provider.models?.find(m => m.id === provider.selectedModelId);

    return (
        <Card variant="secondary" className="overflow-hidden">
            <div className="flex flex-col gap-3">
                <ProviderHeader
                    provider={provider}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleEnabled={onToggleEnabled}
                />
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <Tooltip.Trigger>
                            <Button
                                size="sm"
                                variant="outline"
                                onPress={onTest}
                                isDisabled={isTesting}
                                className="flex-1"
                            >
                                {isTesting ? (
                                    <Spinner size="sm" color="current" />
                                ) : (
                                    <>
                                        <TestTube2 className="w-4 h-4" />
                                        Test Connection
                                    </>
                                )}
                            </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <Tooltip.Arrow />
                            <p className="text-sm">Test provider connection</p>
                        </Tooltip.Content>
                    </Tooltip>

                    <Tooltip>
                        <Tooltip.Trigger>
                            <Button
                                size="sm"
                                variant="outline"
                                onPress={onOpenModels}
                                className="flex-1"
                            >
                                <Database className="w-4 h-4" />
                                Models ({provider.models?.length || 0})
                            </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <Tooltip.Arrow />
                            <p className="text-sm">Manage available models</p>
                        </Tooltip.Content>
                    </Tooltip>
                </div>

                {/* Test Result */}
                {testResult && (
                    <div className={`text-sm p-2 rounded-md ${testResult.success ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                        {testResult.message}
                    </div>
                )}
            </div>
        </Card>
    );
}
