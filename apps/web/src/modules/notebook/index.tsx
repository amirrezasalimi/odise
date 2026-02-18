import React from "react";
import { Header } from "./components/header";
import Sources from "./components/sources";
import Chat from "./components/chat";
import Hub from "./components/hub";


interface NotebookProps {
    notebookId: string;
}

const Notebook = ({ notebookId }: NotebookProps) => {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [progress, setProgress] = React.useState(30);
    const [volume, setVolume] = React.useState(70);

    const togglePlayPause = () => setIsPlaying(!isPlaying);


    const speakers: {
        name: "kokoro"
        id: string
    }[] = []

    return (
        <div className="h-screen flex flex-col p-4 gap-2">
            <Header />
            <div className="flex gap-4 h-[calc(100%-2.5rem)]">
                <Sources />
                <Chat />
                <Hub />
            </div>
        </div>
    );
};

export default Notebook;
