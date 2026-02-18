import { useQuery, useMutation } from "convex/react";
import { api } from "@odise/backend/convex/_generated/api";
import { CONFIG_KEYS } from "@/shared/constants/config";
import { LANGUAGES } from "@/shared/constants/languages";
import { Label, ListBox, Autocomplete, SearchField, useFilter, EmptyState } from "@heroui/react";
import type { Key } from "@heroui/react";

const MainTab = () => {
    const aiLanguage = useQuery(api.apis.config.getConfig, {
        key: CONFIG_KEYS.ai_language,
    });
    const setConfig = useMutation(api.apis.config.setConfig);
    const { contains } = useFilter({ sensitivity: "base" });

    const selectedKey: Key | null = (aiLanguage as Key | null) ?? "en";

    const handleLanguageChange = async (key: Key | Key[] | null) => {
        if (typeof key === "string") {
            await setConfig({
                key: CONFIG_KEYS.ai_language,
                value: key,
            });
        }
    };

    const selectedLanguage = LANGUAGES.find((lang) => lang.code === (aiLanguage ?? "en"));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold mb-2">General</h2>
                <p className="text-muted-foreground">
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
            </div>
        </div>
    );
};

export default MainTab;
