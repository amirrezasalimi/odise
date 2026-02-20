import { Label, ListBox, Autocomplete, SearchField, useFilter, EmptyState, Switch, Select } from "@heroui/react";
import type { Key } from "@heroui/react";
import { LANGUAGES } from "@/shared/constants/languages";
import { useMainTab } from "./hooks/use-main-tab";

const MainTab = () => {
    const { contains } = useFilter({ sensitivity: "base" });
    const {
        selectedKey,
        selectedLanguage,
        handleLanguageChange,
        isEmbeddingEnabled,
        selectedProviderId,
        selectedProvider,
        enabledEmbeddingProviders,
        handleEmbeddingToggle,
        handleProviderChange,
    } = useMainTab();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-base font-semibold mb-1.5">General</h2>
                <p className="text-sm text-muted">
                    Configure general application settings and preferences.
                </p>
            </div>

            <div className="space-y-4">
                <div className="w-full max-w-md">
                    <Label htmlFor="ai-language">AI Language</Label>
                    <Autocomplete
                        id="ai-language"
                        placeholder="Select a language"
                        selectionMode="single"
                        value={selectedKey}
                        onChange={handleLanguageChange}
                        className="w-full"
                        variant="secondary"
                    >
                        <Autocomplete.Trigger>
                            <Autocomplete.Value>
                                {({ defaultChildren, isPlaceholder }) => {
                                    if (!isPlaceholder && selectedLanguage) {
                                        return `${selectedLanguage.name} (${selectedLanguage.code})`;
                                    }
                                    return defaultChildren;
                                }}
                            </Autocomplete.Value>
                            <Autocomplete.Indicator />
                        </Autocomplete.Trigger>
                        <Autocomplete.Popover>
                            <Autocomplete.Filter filter={contains}>
                                <SearchField autoFocus name="search" variant="secondary">
                                    <SearchField.Group>
                                        <SearchField.SearchIcon />
                                        <SearchField.Input placeholder="Search languages..." />
                                        <SearchField.ClearButton />
                                    </SearchField.Group>
                                </SearchField>
                                <ListBox
                                    renderEmptyState={() => <EmptyState>No results found</EmptyState>}
                                >
                                    {LANGUAGES.map((language) => (
                                        <ListBox.Item
                                            key={language.code}
                                            id={language.code}
                                            textValue={language.name}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{language.name}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {language.code}
                                                </span>
                                            </div>
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Autocomplete.Filter>
                        </Autocomplete.Popover>
                    </Autocomplete>
                </div>

                <div className="w-full max-w-md space-y-4">
                    <div className="flex items-center gap-3">
                        <Switch
                            isSelected={isEmbeddingEnabled}
                            onChange={handleEmbeddingToggle}
                        >
                            <Switch.Control>
                                <Switch.Thumb />
                            </Switch.Control>
                        </Switch>
                        <Label className="text-sm">Enable Chat Source Embedding</Label>
                    </div>

                    {isEmbeddingEnabled && (
                        <div>
                            <Label htmlFor="embedding-provider">Embedding Provider</Label>
                            <Select
                                id="embedding-provider"
                                placeholder="Select a provider"
                                selectionMode="single"
                                selectedKey={selectedProviderId}
                                onSelectionChange={handleProviderChange}
                                className="w-full"
                                variant="secondary"
                            >
                                <Select.Trigger>
                                    <Select.Value>
                                        {({ defaultChildren, isPlaceholder }) => {
                                            if (!isPlaceholder && selectedProvider) {
                                                return selectedProvider.name;
                                            }
                                            return defaultChildren;
                                        }}
                                    </Select.Value>
                                    <Select.Indicator />
                                </Select.Trigger>
                                <Select.Popover>
                                    <ListBox
                                        renderEmptyState={() => <EmptyState>No providers found</EmptyState>}
                                    >
                                        {enabledEmbeddingProviders.map((provider) => (
                                            <ListBox.Item
                                                key={provider.id}
                                                id={provider.id}
                                                textValue={provider.name}
                                            >
                                                <span className="font-medium">{provider.name}</span>
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Select.Popover>
                            </Select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MainTab;
