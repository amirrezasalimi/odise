import usePlugins from "@/shared/hooks/plugins";
import { useEffect } from "react";
import { Loader } from "../loader";

const PluginLoaderWrapper = ({
    children
}: {
    children: React.ReactNode
}) => {
    const plugins = usePlugins();

    useEffect(() => {
        plugins.load();
    }, [plugins.configsLoading]);
    if (plugins.configsLoading || plugins.isLoadingPlugins) {
        return <Loader />
    }

    return children;
}

export default PluginLoaderWrapper;