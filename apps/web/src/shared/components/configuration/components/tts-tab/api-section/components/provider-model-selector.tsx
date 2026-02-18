import { Autocomplete, useFilter, SearchField, ListBox } from "@heroui/react";
import type { TTSProviderVariant } from "@odise/types";
import type { ApiTTSProviderItem } from "@/shared/types/config";

interface ProviderModelSelectorProps {
    provider: ApiTTSProviderItem & {
        variants?: TTSProviderVariant[];
        selectedModelId?: string;
    };
    onVariantChange: (key: React.Key | null) => void;
}

export function ProviderModelSelector({ provider, onVariantChange }: ProviderModelSelectorProps) {
    const { contains } = useFilter({ sensitivity: "base" });

    return (
        <Autocomplete
            className="w-48"
            placeholder="Model"
            defaultSelectedKey={provider.selectedModelId}
            onSelectionChange={onVariantChange}
        >
            <Autocomplete.Trigger>
                <Autocomplete.Value />
                <Autocomplete.Indicator />
            </Autocomplete.Trigger>
            <Autocomplete.Popover>
                <Autocomplete.Filter filter={contains}>
                    <SearchField autoFocus name="search" variant="secondary">
                        <SearchField.Group>
                            <SearchField.Input placeholder="Search..." />
                            <SearchField.ClearButton />
                        </SearchField.Group>
                    </SearchField>
                    <ListBox>
                        {provider.variants?.map((variant: TTSProviderVariant) => (
                            <ListBox.Item
                                key={variant.id}
                                id={variant.id}
                                textValue={variant.name}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <span className="truncate">{variant.name}</span>
                                </div>
                                {provider.selectedModelId === variant.id && (
                                    <ListBox.ItemIndicator />
                                )}
                            </ListBox.Item>
                        ))}
                    </ListBox>
                </Autocomplete.Filter>
            </Autocomplete.Popover>
        </Autocomplete>
    );
}
