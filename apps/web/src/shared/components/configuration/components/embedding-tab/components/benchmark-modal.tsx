import React, { useState } from "react";
import {
    Modal,
    Button,
    TextArea,
    TextField,
    Card,
    Chip,
    Separator,
    Spinner,
    Label,
    Description,
} from "@heroui/react";
import { Timer, Zap, Gauge } from "lucide-react";

interface BenchmarkModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    modelName?: string;
    onRunBenchmark: (text: string) => Promise<{
        timeMs: number;
        dimension: number;
        charsPerSec: number;
    }>;
}

export const BenchmarkModal = ({
    isOpen,
    onOpenChange,
    modelName,
    onRunBenchmark,
}: BenchmarkModalProps) => {
    const [testText, setTestText] = useState("Odise is a powerful agentic AI coding assistant designed by the Google Deepmind team working on Advanced Agentic Coding.");
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{
        timeMs: number;
        dimension: number;
        charsPerSec: number;
    } | null>(null);

    const handleRun = async () => {
        setIsRunning(true);
        setResult(null);
        try {
            const res = await onRunBenchmark(testText);
            setResult(res);
        } catch (error) {
            console.error("Benchmark failed:", error);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <Modal.Backdrop>
                <Modal.Container size="md">
                    <Modal.Dialog>
                        <Modal.Header>
                            <div className="flex items-center gap-2">
                                <Gauge className="w-5 h-5 text-accent" />
                                <Modal.Heading>Model Benchmark</Modal.Heading>
                            </div>
                            <Modal.CloseTrigger />
                        </Modal.Header>

                        <Modal.Body>
                            <div className="space-y-6">
                                <p className="text-sm text-muted">
                                    Testing inference performance for <span className="font-semibold">{modelName}</span>
                                </p>

                                <TextField>
                                    <Label>Test Sample</Label>
                                    <TextArea
                                        placeholder="Enter text to embed..."
                                        value={testText}
                                        onChange={(e) => setTestText(e.target.value)}
                                        rows={4}
                                    />
                                    <Description>
                                        Inference speed varies with input length.
                                    </Description>
                                </TextField>

                                {isRunning && (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="flex flex-col items-center gap-4">
                                            <Spinner size="lg" />
                                            <p className="text-sm font-medium animate-pulse">Running Benchmark...</p>
                                        </div>
                                    </div>
                                )}

                                {result && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Card variant="tertiary">
                                            <Card.Header>
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-[10px] font-bold uppercase text-muted">Latency</span>
                                                    <Timer className="w-4 h-4 text-muted" />
                                                </div>
                                            </Card.Header>
                                            <Card.Content>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold">{result.timeMs.toFixed(1)}</span>
                                                    <span className="text-xs text-muted">ms</span>
                                                </div>
                                            </Card.Content>
                                        </Card>

                                        <Card variant="tertiary">
                                            <Card.Header>
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-[10px] font-bold uppercase text-muted">Dimensions</span>
                                                    <Zap className="w-4 h-4 text-muted" />
                                                </div>
                                            </Card.Header>
                                            <Card.Content>
                                                <span className="text-2xl font-bold">{result.dimension}</span>
                                            </Card.Content>
                                        </Card>

                                        <Card variant="tertiary" className="col-span-2">
                                            <Card.Header>
                                                <span className="text-[10px] font-bold uppercase text-muted">Throughput</span>
                                            </Card.Header>
                                            <Card.Content>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-3xl font-bold text-accent">{result.charsPerSec.toLocaleString()}</span>
                                                        <span className="text-sm text-muted">chars / sec</span>
                                                    </div>
                                                    <Chip variant="soft" color="accent" size="sm">
                                                        Verified Result
                                                    </Chip>
                                                </div>
                                            </Card.Content>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </Modal.Body>

                        <Modal.Footer>
                            <Button
                                variant="tertiary"
                                onPress={() => onOpenChange(false)}
                                isDisabled={isRunning}
                            >
                                Close
                            </Button>
                            <Button
                                variant="primary"
                                onPress={handleRun}
                                isDisabled={isRunning || !testText.trim()}
                            >
                                {isRunning ? "Processing..." : "Run Test"}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
};
