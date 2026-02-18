import { Button, Card, CardContent, Chip, Slider } from "@heroui/react"
import { HumanSpeakIcon } from "@/shared/components/icons/speak"
import { ArrowDownIcon } from "@/shared/components/icons/arrow-down"
import { IconPlayerPauseFilled, IconPlayerPlayFilled, IconPlayerSkipBackFilled, IconPlayerSkipForwardFilled, IconSettings, IconVolume } from "@tabler/icons-react"
import { useState } from "react"

export const AudioOverviewView = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(30);
    const [volume, setVolume] = useState(70);

    const togglePlayPause = () => setIsPlaying(!isPlaying);

    return <div className="flex flex-col gap-4 h-full w-full">
        <div className="flex w-full justify-between">
            <div className="flex gap-2 items-center cursor-pointer">
                <HumanSpeakIcon className="size-5" />
                <div className="flex gap-3 items-center">
                    <span className="text-md">
                        Larry
                    </span>
                    <Chip size="sm" color="accent">
                        kokoro-tts
                    </Chip>
                    <ArrowDownIcon className="ml-6 size-4" />

                </div>
            </div>
            <div>
                <Button isIconOnly variant="ghost">
                    <IconSettings className="size-5" />
                </Button>
            </div>
        </div>
        <div className="h-full flex">

        </div>
    </div>

    {/* player */ }
    <div className="flex flex-col gap-4 sticky bottom-0">
        {/* Progress slider */}
        <div className="flex flex-col gap-2">
            {/* we show only when paused */}
            {/* <div className="flex justify-between text-sm text-default-500">
                                        <span>1:23</span>
                                        <span>4:56</span>
                                    </div> */}
            <Slider
                value={progress}
                onChange={(value) => setProgress(Array.isArray(value) ? value[0] : value)}
                className="max-w-full"
            >
                <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                </Slider.Track>
            </Slider>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
            <Button isIconOnly variant="ghost" size="lg">
                <IconPlayerSkipBackFilled size={20} />
            </Button>
            <Button
                isIconOnly
                size="lg"
                variant="primary"
                onPress={togglePlayPause}
            >
                {isPlaying ? <IconPlayerPauseFilled size={24} /> : <IconPlayerPlayFilled size={24} />}
            </Button>
            <Button isIconOnly variant="ghost" size="lg">
                <IconPlayerSkipForwardFilled size={20} />
            </Button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 ">
            <IconVolume size={18} className="text-default-500" />
            <Slider
                step={0.1}
                value={volume}
                onChange={(value) => setVolume(Array.isArray(value) ? value[0] : value)}
                className="max-w-1/3 flex"
            >
                <Slider.Track className={"h-3"}  >
                    <Slider.Fill />
                    {/* <Slider.Thumb /> */}
                </Slider.Track>
            </Slider>
        </div>
    </div>
}