import { Button, Chip, Spinner } from "@heroui/react";
import { HumanSpeakIcon } from "@/shared/components/icons/speak";
import type { TTSProviderSpeaker } from "@odise/types";
import type { ApiTTSProviderItem } from "@/shared/types/config";

interface ProviderSpeakersProps {
    provider: ApiTTSProviderItem & {
        speakers?: TTSProviderSpeaker[];
        isLoadingSpeakers?: boolean;
        customSpeakers?: string[];
    };
    selectedSpeakerId: string | undefined;
    testLoading: boolean;
    onSpeakerSelect: (speakerId: string) => void;
    onTestSpeaker: () => void;
    onOpenCustomSpeakers: () => void;
}

export function ProviderSpeakers({
    provider,
    selectedSpeakerId,
    testLoading,
    onSpeakerSelect,
    onTestSpeaker,
    onOpenCustomSpeakers,
}: ProviderSpeakersProps) {
    const apiSpeakers = provider.speakers || [];
    const customSpeakers = provider.customSpeakers || [];

    const customSpeakerObjects: TTSProviderSpeaker[] = customSpeakers.map((name, index) => ({
        id: `custom-${index}`,
        name: name,
    }));

    const combinedSpeakers = [...apiSpeakers, ...customSpeakerObjects];

    // Check if any speaker has a lang property
    const hasLangs = combinedSpeakers.some((s: TTSProviderSpeaker) => s.lang);

    return (
        <div className="flex flex-col border-t gap-2 border-tertiary py-2">
            <div className="flex gap-1 flex-row">
                <span className="text-sm cursor-help">Speakers</span>
            </div>
            {!hasLangs ? (
                // No grouping needed if no lang exists
                <div className="flex flex-wrap gap-1.5">
                    {combinedSpeakers.map((speaker: TTSProviderSpeaker) => (
                        <div
                            key={speaker.id}
                            onClick={() => onSpeakerSelect(speaker.id)}
                            className="cursor-pointer"
                        >
                            <Chip
                                size="sm"
                                variant="soft"
                                color={selectedSpeakerId === speaker.id ? "accent" : "default"}
                            >
                                {speaker.name}
                            </Chip>
                        </div>
                    ))}
                </div>
            ) : (
                // Group speakers by lang
                (() => {
                    const groupedSpeakers = combinedSpeakers.reduce((acc: Record<string, TTSProviderSpeaker[]>, speaker: TTSProviderSpeaker) => {
                        const lang = speaker.lang || "Other";
                        if (!acc[lang]) {
                            acc[lang] = [];
                        }
                        acc[lang].push(speaker);
                        return acc;
                    }, {} as Record<string, TTSProviderSpeaker[]>);

                    return (
                        <div className="flex flex-col gap-2">
                            {Object.entries(groupedSpeakers).map(([lang, langSpeakers]) => (
                                <div key={lang} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 bg-accent rotate-45 rounded-sm" />
                                        <span className="text-sm font-medium text-foreground">{lang}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {langSpeakers.map((speaker: TTSProviderSpeaker) => (
                                            <div
                                                key={speaker.id}
                                                onClick={() => onSpeakerSelect(speaker.id)}
                                                className="cursor-pointer"
                                            >
                                                <Chip
                                                    size="sm"
                                                    variant="soft"
                                                    color={selectedSpeakerId === speaker.id ? "accent" : "default"}
                                                >
                                                    {speaker.name}
                                                </Chip>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()
            )}
            <div className="pt-1 flex items-center gap-2">
                <Button
                    size="sm"
                    variant="tertiary"
                    isDisabled={!selectedSpeakerId || testLoading}
                    onPress={onTestSpeaker}
                    className="h-7 text-xs"
                >
                    {testLoading ? (
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
                <Button
                    variant="tertiary"
                    size="sm"
                    className="h-7 text-xs"
                    onPress={onOpenCustomSpeakers}
                >
                    Custom Speakers
                </Button>
            </div>
        </div>
    );
}
