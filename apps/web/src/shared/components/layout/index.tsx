import '@fontsource-variable/instrument-sans';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { env } from "@odise/env/web";
import ConfigurationModal from '../configuration';
import PluginLoaderWrapper from './plugin-loader';

const convex = new ConvexReactClient(env.VITE_CONVEX_URL);

export const Layout = ({
    children
}: {
    children: React.ReactNode
}) => {

    return <>
        <ConvexProvider client={convex}>
            <PluginLoaderWrapper>
                {children}
            </PluginLoaderWrapper>
            <ConfigurationModal />
        </ConvexProvider>
    </>;
}