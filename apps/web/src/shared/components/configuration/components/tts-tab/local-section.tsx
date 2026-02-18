import { Card, Button, Select, ListBox, Spinner, Tooltip, Chip } from "@heroui/react";
import clsx from "clsx";
import React, { useEffect } from "react";
import { ArrowDownIcon } from "@/shared/components/icons/arrow-down";
import { HumanSpeakIcon } from "@/shared/components/icons/speak";
import type { TTSProvider } from "@odise/types";
import type { TTSProviderVariant, TTSProviderSpeaker } from "@odise/types";
import type { TTSPluginState } from "@/shared/store/app";

interface LocalSectionProps {
    plugins: TTSProvider[];
    pluginStates: Record<string, TTSPluginState>;
    loadPlugin: (pluginId: string, variantId?: string) => Promise<void>;
    unloadPlugin: (pluginId: string) => Promise<void>;
    loadVariants: (pluginId: string) => Promise<TTSProviderVariant[]>;
    updatePluginState: (pluginId: string, state: Partial<TTSPluginState>) => void;
}

const LocalSection = ({
    plugins,
    pluginStates,
    loadPlugin,
    unloadPlugin,
    loadVariants,
    updatePluginState,
}: LocalSectionProps) => {
    const [selectedVariants, setSelectedVariants] = React.useState<Record<string, string>>({});
    const [expandedSpeakers, setExpandedSpeakers] = React.useState<Record<string, boolean>>({});
    const [selectedSpeakers, setSelectedSpeakers] = React.useState<Record<string, string>>({});
    const [testLoading, setTestLoading] = React.useState<Record<string, boolean>>({});

    // Load variants by default for all plugins
    useEffect(() => {
        plugins.filter(p => p.options?.hasVariants).forEach(plugin => {
            const pluginId = plugin.info?.id;
            if (pluginId && !pluginStates[pluginId]?.variants?.length) {
                loadVariants(pluginId);
            }
        });
    }, [plugins, pluginStates, loadVariants]);

    // Select default speaker when plugin loads and has speakers
    useEffect(() => {
        plugins.forEach(plugin => {
            const pluginId = plugin.info?.id;
            if (!pluginId) return;

            const state = pluginStates[pluginId];

            // Only auto-select if plugin is loaded, has speakers, and no speaker is selected yet
            if (state?.isLoaded && state?.speakers?.length > 0 && !selectedSpeakers[pluginId]) {
                const defaultSpeakerId = plugin.options?.defaultSpeakerId;
                // Check if default speaker exists in the speakers list
                if (defaultSpeakerId && state.speakers.some((s: { id: string }) => s.id === defaultSpeakerId)) {
                    setSelectedSpeakers(prev => ({ ...prev, [pluginId]: defaultSpeakerId }));
                } else {
                    // Fallback to first speaker if default doesn't exist
                    setSelectedSpeakers(prev => ({ ...prev, [pluginId]: state.speakers[0].id }));
                }
            }
        });
    }, [plugins, pluginStates, selectedSpeakers]);

    const handleLoadPlugin = async (pluginId: string) => {
        const state = pluginStates[pluginId];
        const variantId = selectedVariants[pluginId] || state?.selectedVariant || plugins.find(p => p.info?.id === pluginId)?.options?.defaultVariant;
        await loadPlugin(pluginId, variantId);
    };

    const handleUnloadPlugin = async (pluginId: string) => {
        await unloadPlugin(pluginId);
    };

    const handleVariantChange = async (pluginId: string, key: React.Key | null) => {
        if (!key) return;
        const variantId = String(key);
        setSelectedVariants(prev => ({ ...prev, [pluginId]: variantId }));
        const state = pluginStates[pluginId];
        if (state?.isLoaded) {
            // Reload with new variant
            await loadPlugin(pluginId, variantId);
        } else {
            // Just update selected variant
            updatePluginState(pluginId, { selectedVariant: variantId });
        }
    };

    const toggleSpeakers = (pluginId: string) => {
        setExpandedSpeakers(prev => ({ ...prev, [pluginId]: !prev[pluginId] }));
    };

    const handleSpeakerSelect = (pluginId: string, speakerId: string) => {
        setSelectedSpeakers(prev => ({ ...prev, [pluginId]: speakerId }));
    };

    const handleTestSpeaker = async (pluginId: string) => {
        const plugin = plugins.find(p => p.info?.id === pluginId);
        const selectedSpeakerId = selectedSpeakers[pluginId];

        if (!plugin || !selectedSpeakerId) return;

        setTestLoading(prev => ({ ...prev, [pluginId]: true }));

        try {
            const result = await plugin.speak({
                text: "Moonlight lingers softly on silent waters.",
                speakerId: selectedSpeakerId
            });

            if (result.result?.audio) {
                const audio = new Audio(URL.createObjectURL(result.result.audio));
                audio.play();
            }
        } catch (error) {
            console.error(`Failed to test speaker for plugin ${pluginId}:`, error);
        } finally {
            setTestLoading(prev => ({ ...prev, [pluginId]: false }));
        }
    };

    const localPlugins = plugins.filter(p => p.options?.hasVariants);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-semibold mb-1.5">Local Models</h3>
                <p className="text-sm text-muted">
                    Manage local TTS models. Load a model to use it for text-to-speech.
                </p>
            </div>

            {localPlugins.length === 0 ? (
                <Card variant="secondary" className="p-6">
                    <Card.Content>
                        <p className="text-center text-muted">No local TTS models available</p>
                    </Card.Content>
                </Card>
            ) : (
                <div className="space-y-4">
                    {localPlugins.map((plugin) => {
                        const pluginId = plugin.info?.id || "";
                        const state = pluginStates[pluginId];
                        const isLoaded = state?.isLoaded || false;
                        const isLoading = state?.isLoading || false;
                        const loadingProgress = state?.loadingProgress || 0;
                        const variants = state?.variants || [];
                        const speakers = state?.speakers || [];

                        return (
                            <Card key={pluginId} variant="secondary" className="overflow-hidden">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            {/* Status indicator circle */}
                                            <span className={`w-2 h-2 rounded-full ${isLoaded ? 'bg-success' : 'bg-muted'}`} />
                                            <Tooltip>
                                                <Tooltip.Trigger>
                                                    <span className="text-base cursor-help">{plugin.info?.name}</span>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content>
                                                    <Tooltip.Arrow />
                                                    <div className="space-y-1">
                                                        {plugin.info?.description && (
                                                            <p className="text-sm">{plugin.info.description}</p>
                                                        )}
                                                        <div className="flex flex-wrap gap-2 text-xs text-muted">
                                                            {plugin.info?.version && (
                                                                <span>v{plugin.info.version}</span>
                                                            )}
                                                            {plugin.info?.author && (
                                                                <span>by {plugin.info.author}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Tooltip.Content>
                                            </Tooltip>
                                            {/* Speakers toggle button */}
                                            {isLoaded && speakers.length > 0 && (
                                                <Button
                                                    variant="tertiary"
                                                    size="sm"
                                                    isIconOnly
                                                    onPress={() => toggleSpeakers(pluginId)}
                                                    className="h-6 w-6 min-w-6"
                                                >
                                                    <ArrowDownIcon
                                                        className={clsx(
                                                            "w-4 h-4 transition-transform duration-200",
                                                            expandedSpeakers[pluginId] ? "rotate-180" : ""
                                                        )}
                                                    />
                                                </Button>
                                            )}
                                        </div>
                                        {/* Supported Languages */}
                                        {plugin.options?.supportedLanguages && (
                                            <div className="flex flex-wrap gap-1.5 pl-4">
                                                {plugin.options.supportedLanguages.map((lang: string) => (
                                                    <Chip
                                                        key={lang}
                                                        size="sm"
                                                        variant="soft"
                                                        color="accent"
                                                    >
                                                        {lang}
                                                    </Chip>
                                                ))}
                                            </div>
                                        )}
                                        {/* Features */}
                                        <div className="flex flex-wrap gap-1.5 pl-4">
                                            {plugin.options?.supportChunking && (
                                                <Chip size="sm" variant="tertiary">
                                                    Chunking
                                                </Chip>
                                            )}
                                            {plugin.options?.supportVoiceCloning && (
                                                <Chip size="sm" variant="tertiary">
                                                    Voice Cloning
                                                </Chip>
                                            )}
                                            {plugin.options?.supportVoiceDesign && (
                                                <Chip size="sm" variant="tertiary">
                                                    Voice Design
                                                </Chip>
                                            )}
                                        </div>
                                        {/* Speakers Section */}
                                        {isLoaded && speakers.length > 0 && expandedSpeakers[pluginId] && (
                                            <div className="flex flex-col border-t gap-2 border-tertiary py-2">
                                                <div className="flex gap-1 flex-row">
                                                    <span className="text-sm cursor-help">Speakers</span>
                                                </div>
                                                {(() => {
                                                    // Check if any speaker has a lang property
                                                    const hasLangs = speakers.some((s: TTSProviderSpeaker) => s.lang);

                                                    if (!hasLangs) {
                                                        // No grouping needed if no lang exists
                                                        return (
                                                            <div className="flex flex-wrap gap-1.5 pl-4">
                                                                {speakers.map((speaker: TTSProviderSpeaker) => (
                                                                    <div
                                                                        key={speaker.id}
                                                                        onClick={() => handleSpeakerSelect(pluginId, speaker.id)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Chip
                                                                            size="sm"
                                                                            variant="soft"
                                                                            color={
                                                                                selectedSpeakers[pluginId] === speaker.id ? "accent" : "default"
                                                                            }
                                                                        >
                                                                            {speaker.name}
                                                                        </Chip>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    }

                                                    // Group speakers by lang
                                                    const groupedSpeakers = speakers.reduce((acc: Record<string, TTSProviderSpeaker[]>, speaker: TTSProviderSpeaker) => {
                                                        const lang = speaker.lang || "Other";
                                                        if (!acc[lang]) {
                                                            acc[lang] = [];
                                                        }
                                                        acc[lang].push(speaker);
                                                        return acc;
                                                    }, {} as Record<string, TTSProviderSpeaker[]>);

                                                    return (
                                                        <div className="flex flex-col gap-2 pl-4">
                                                            {Object.entries(groupedSpeakers).map(([lang, langSpeakers]) => (
                                                                <div key={lang} className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            className="size-2 bg-accent rotate-45 rounded-sm"
                                                                        />
                                                                        <span className="text-sm font-medium text-foreground">{lang}</span>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {langSpeakers.map((speaker: TTSProviderSpeaker) => (
                                                                            <div
                                                                                key={speaker.id}
                                                                                onClick={() => handleSpeakerSelect(pluginId, speaker.id)}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <Chip
                                                                                    size="sm"
                                                                                    variant="soft"
                                                                                    color={
                                                                                        selectedSpeakers[pluginId] === speaker.id ? "accent" : "default"
                                                                                    }
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
                                                })()}
                                                <div className="pl-4 pt-1">
                                                    <Button
                                                        size="sm"
                                                        variant="tertiary"
                                                        isDisabled={!selectedSpeakers[pluginId] || testLoading[pluginId]}
                                                        onPress={() => handleTestSpeaker(pluginId)}
                                                        className="h-7 text-xs"
                                                    >
                                                        {testLoading[pluginId] ? (
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
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                    {/* Buttons and select on the right */}
                                    <div className="flex items-center gap-2">
                                        {plugin.options?.hasVariants && (
                                            <Select
                                                className="w-48"
                                                placeholder="Variant"
                                                defaultSelectedKey={plugin.options.defaultVariant}
                                                isDisabled={isLoading}
                                                onSelectionChange={(key) => handleVariantChange(pluginId, key)}
                                            >
                                                <Select.Trigger>
                                                    <Select.Value />
                                                    <Select.Indicator />
                                                </Select.Trigger>
                                                <Select.Popover>
                                                    <ListBox>
                                                        {variants.map((variant: TTSProviderVariant) => (
                                                            <ListBox.Item
                                                                key={variant.id}
                                                                id={variant.id}
                                                                textValue={variant.name}
                                                            >
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span>{variant.name}</span>
                                                                    <span className="text-xs text-muted">
                                                                        {variant.sizeMB} MB
                                                                    </span>
                                                                </div>
                                                                {variant.loaded && (
                                                                    <ListBox.ItemIndicator />
                                                                )}
                                                            </ListBox.Item>
                                                        ))}
                                                    </ListBox>
                                                </Select.Popover>
                                            </Select>
                                        )}
                                        <Button
                                            variant={isLoaded ? "tertiary" : "primary"}
                                            size="sm"
                                            isDisabled={isLoading}
                                            onPress={() => isLoaded ? handleUnloadPlugin(pluginId) : handleLoadPlugin(pluginId)}
                                            className={
                                                clsx(
                                                    "relative",
                                                    isLoaded ? "border border-white/50" : "",
                                                )
                                            }
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <Spinner size="sm" color="current" />
                                                    <span>{Math.round(loadingProgress)}%</span>
                                                </span>
                                            ) : isLoaded ? (
                                                "Eject"
                                            ) : (
                                                "Load"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LocalSection;
