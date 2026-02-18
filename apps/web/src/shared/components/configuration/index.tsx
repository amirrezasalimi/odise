import { Modal, Button } from "@heroui/react";
import useAppStore from "@/shared/store/app";
import {
    Home,
    Mic,
    Brain,
    Github,
    Plus,
    X
} from "lucide-react";
import { useState } from "react";
import TTSProvidersTab from "./components/tts-tab";
import LLMTab from "./components/llm-tab";

const tabs = [
    { id: "main", label: "Main", icon: Home },
    { id: "tts", label: "TTS Providers", icon: Mic },
    { id: "llm", label: "LLM Providers", icon: Brain },
] as const;

const ConfigurationModal = () => {
    const { isConfigModalOpen, toggleConfigModal } = useAppStore();
    const [selectedTab, setSelectedTab] = useState("main");

    return (
        <Modal>
            <Modal.Backdrop isOpen={isConfigModalOpen} onOpenChange={toggleConfigModal}>
                <Modal.Container>
                    <Modal.Dialog className="max-w-6xl h-175 p-0">
                        <Modal.CloseTrigger>
                            <X className="size-4" />
                        </Modal.CloseTrigger>
                        <div className="flex h-full">
                            {/* Left Sidebar - Custom Tabs */}
                            <div className="w-56 border-r border-border/50 flex flex-col">
                                <div className="px-4 py-3 border-b border-border/50">
                                    <h2 className="text-sm font-semibold">Configuration</h2>
                                </div>

                                {/* Custom Tabs */}
                                <div className="flex-1 px-2 py-3 space-y-1">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setSelectedTab(tab.id)}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium
                                                    transition-colors
                                                    ${selectedTab === tab.id
                                                        ? "bg-accent/10 text-accent"
                                                        : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                                                    }
                                                `}
                                            >
                                                <Icon className="size-4" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* GitHub & Creator Links */}
                                <div className="px-2 py-3 border-t border-border/50 space-y-1">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-3 h-9 px-3"
                                        size="sm"
                                    >
                                        <Github className="size-4" />
                                        <span className="text-sm">GitHub</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Right Content Area */}
                            <div className="flex-1 p-5 overflow-y-auto">
                                {selectedTab === "main" && (
                                    <div>
                                        <h3 className="text-base font-semibold mb-1.5">Main Settings</h3>
                                        <p className="text-sm text-muted-foreground mb-5">
                                            Configure your general application preferences
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Main configuration options will appear here
                                        </p>
                                    </div>
                                )}

                                {selectedTab === "tts" && (
                                    <TTSProvidersTab />
                                )}

                                {selectedTab === "llm" && (
                                    <LLMTab />
                                )}
                            </div>
                        </div>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
};

export default ConfigurationModal;
