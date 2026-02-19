import { useState } from "react";
import type { TTSProvider } from "@odise/types";

export const useProviderTest = () => {
    const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});

    const testSpeaker = async (pluginId: string, instance: TTSProvider, speakerId: string) => {
        if (!instance || !speakerId) return;

        setIsTesting(prev => ({ ...prev, [pluginId]: true }));
        try {
            const result = await instance.speak({
                text: "Moonlight lingers softly on silent waters.",
                speakerId
            });

            if (result.result?.audio) {
                const audio = new Audio(URL.createObjectURL(result.result.audio));
                audio.play();
            }
        } catch (error) {
            console.error(`Failed to test speaker for ${pluginId}:`, error);
        } finally {
            setIsTesting(prev => ({ ...prev, [pluginId]: false }));
        }
    };

    return { isTesting, testSpeaker };
};
