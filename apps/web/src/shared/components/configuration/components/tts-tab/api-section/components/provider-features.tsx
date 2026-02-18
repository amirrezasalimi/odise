import { Chip } from "@heroui/react";
import type { TTSProvider, TTSProviderSpeaker } from "@odise/types";
import type { ApiTTSProviderItem } from "@/shared/types/config";
import { useState } from "react";

interface ProviderFeaturesProps {
    provider: ApiTTSProviderItem & {
        speakers?: TTSProviderSpeaker[];
        isLoadingSpeakers?: boolean;
    };
    plugin: TTSProvider | undefined;
}

const MAX_LANGUAGES = 10;

export function ProviderFeatures({ provider, plugin }: ProviderFeaturesProps) {
    const [showAllLanguages, setShowAllLanguages] = useState(false);

    const languages = plugin?.options?.supportedLanguages ?? [];
    const hasMoreLanguages = languages.length > MAX_LANGUAGES;
    const displayedLanguages = showAllLanguages ? languages : languages.slice(0, MAX_LANGUAGES);

    return (
        <div className="flex flex-col gap-2">
            {/* Supported Languages */}
            {languages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                    {displayedLanguages.map((lang: string) => (
                        <Chip
                            key={lang}
                            size="sm"
                            variant="soft"
                            color="accent"
                        >
                            {lang}
                        </Chip>
                    ))}
                    {hasMoreLanguages && (
                        <button
                            type="button"
                            onClick={() => setShowAllLanguages(!showAllLanguages)}
                            className="text-xs text-accent hover:underline cursor-pointer"
                        >
                            {showAllLanguages ? "Show less" : `+${languages.length - MAX_LANGUAGES} more`}
                        </button>
                    )}
                </div>
            )}
            {/* Features */}
            <div className="flex flex-wrap gap-1.5">
                {plugin?.options?.supportChunking && (
                    <Chip size="sm" variant="tertiary">
                        Chunking
                    </Chip>
                )}
                {plugin?.options?.supportVoiceCloning && (
                    <Chip size="sm" variant="tertiary">
                        Voice Cloning
                    </Chip>
                )}
                {plugin?.options?.supportVoiceDesign && (
                    <Chip size="sm" variant="tertiary">
                        Voice Design
                    </Chip>
                )}
            </div>
        </div>
    );
}
