import useTTS from "@/shared/hooks/tts";
import LocalSection from "./local-section";
import ApiSection from "./api-section";

const TTSProvidersTab = () => {
    const { plugins, pluginStates, loadPlugin, unloadPlugin, loadVariants, updatePluginState, getSpeakers, configureNonLocalProvider } = useTTS();

    const localPlugins = plugins.filter((plugin) => plugin.options?.isLocal);
    const apiPlugins = plugins.filter((plugin) => !plugin.options?.isLocal);

    return (
        <div className="space-y-6">
            <LocalSection
                plugins={localPlugins}
                pluginStates={pluginStates}
                loadPlugin={loadPlugin}
                unloadPlugin={unloadPlugin}
                loadVariants={loadVariants}
                updatePluginState={updatePluginState}
            />
            <ApiSection
                plugins={apiPlugins}
                getSpeakers={getSpeakers}
                configureNonLocalProvider={configureNonLocalProvider}
            />
        </div>
    );
}

export default TTSProvidersTab;
