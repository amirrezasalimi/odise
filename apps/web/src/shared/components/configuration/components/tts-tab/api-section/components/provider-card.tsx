import { Card, Spinner } from "@heroui/react";
import type { TTSProvider, TTSProviderSpeaker, TTSProviderVariant } from "@odise/types";
import type { ApiTTSProviderItem } from "@/shared/types/config";
import { ProviderHeader } from "./provider-header";
import { ProviderFeatures } from "./provider-features";
import { ProviderSpeakers } from "./provider-speakers";

export interface ApiProviderWithExtras extends ApiTTSProviderItem {
    speakers?: TTSProviderSpeaker[];
    isLoadingSpeakers?: boolean;
    errorLoadingSpeakers?: boolean;
    variants?: TTSProviderVariant[];
    isLoadingVariants?: boolean;
    errorLoadingVariants?: boolean;
}

interface ProviderCardProps {
    provider: ApiProviderWithExtras;
    plugin: TTSProvider | undefined;
    expandedSpeakers: Record<string, boolean>;
    selectedSpeakerId: string | undefined;
    testLoading: boolean;
    onToggleSpeakers: (providerId: string) => void;
    onSpeakerSelect: (speakerId: string) => void;
    onTestSpeaker: () => void;
    onOpenCustomSpeakers: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onToggleEnabled: () => void;
    onVariantChange: (key: React.Key | null) => void;
}

export function ProviderCard({
    provider,
    plugin,
    expandedSpeakers,
    selectedSpeakerId,
    testLoading,
    onToggleSpeakers,
    onSpeakerSelect,
    onTestSpeaker,
    onOpenCustomSpeakers,
    onEdit,
    onDelete,
    onToggleEnabled,
    onVariantChange,
}: ProviderCardProps) {
    const isLoadingSpeakers = provider.isLoadingSpeakers || false;
    const combinedSpeakersCount = (provider.speakers?.length || 0) + (provider.customSpeakers?.length || 0);
    const isSpeakersExpanded = provider.enabled && combinedSpeakersCount > 0 && expandedSpeakers[provider.uid];

    return (
        <Card variant="secondary" className="overflow-hidden">
            <div className="flex flex-col gap-3">
                {/* Header */}
                <ProviderHeader
                    provider={provider}
                    plugin={plugin}
                    expandedSpeakers={expandedSpeakers}
                    onToggleSpeakers={onToggleSpeakers}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleEnabled={onToggleEnabled}
                    onVariantChange={onVariantChange}
                />
                {/* Features */}
                <div className="flex flex-col gap-2">
                    <ProviderFeatures provider={provider} plugin={plugin} />
                    {/* Loading speakers indicator */}
                    {provider.enabled && isLoadingSpeakers && (
                        <div className="flex items-center gap-2 text-sm text-muted">
                            <Spinner size="sm" color="current" />
                            <span>Loading speakers...</span>
                        </div>
                    )}
                    {/* Speakers Section */}
                    {isSpeakersExpanded && (
                        <ProviderSpeakers
                            provider={provider}
                            selectedSpeakerId={selectedSpeakerId}
                            testLoading={testLoading}
                            onSpeakerSelect={onSpeakerSelect}
                            onTestSpeaker={onTestSpeaker}
                            onOpenCustomSpeakers={onOpenCustomSpeakers}
                        />
                    )}
                </div>
            </div>
        </Card>
    );
}
