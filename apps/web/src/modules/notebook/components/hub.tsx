import { Button, Card, CardContent } from "@heroui/react"
import { HumanSpeakIcon } from "@/shared/components/icons/speak"
import { BookAudio, Edit2Icon, Podcast } from "lucide-react"
import clsx from "clsx"
import { IconCards, IconChartBar, IconGitMerge, IconQuestionMark, IconSlideshow } from "@tabler/icons-react"
import AudioOverviewModal from "./hub/audio-overview/modal"
import type { FC } from "react"
import type { HubModalProps } from "./types/hub"
import useHub from "../hooks/hub"



const HubTypes: {
    name: string,
    icon: React.ReactNode,
    color: string,
    textColor: string,
    modal?: FC<HubModalProps>,
    supportCustomize?: boolean,
    implemented?: boolean

}[] = [
        {
            name: "Audio Overview",
            icon: <HumanSpeakIcon className="size-5" />,
            color: "bg-red-300/10",
            textColor: "text-red-300",
            modal: AudioOverviewModal,
            supportCustomize: true,
            implemented: true
        },
        {
            name: "Book Reader",
            icon: <BookAudio className="size-5" />,
            color: "bg-blue-300/10",
            textColor: "text-blue-300"
        },
        {
            name: "Podcast",
            icon: <Podcast className="size-5" />,
            color: "bg-green-300/10",
            textColor: "text-green-300"
        },
        {
            name: "Mindmap",
            icon: <IconGitMerge className="size-5" />,
            color: "bg-yellow-300/10",
            textColor: "text-yellow-300"
        },
        {
            name: "Quiz",
            icon: <IconQuestionMark className="size-5" />,
            color: "bg-purple-300/10",
            textColor: "text-purple-300"
        },
        {
            name: "Flashcards",
            icon: <IconCards className="size-5" />,
            color: "bg-orange-300/10",
            textColor: "text-orange-300"
        },
        {
            name: "Slides",
            icon: <IconSlideshow className="size-5" />,
            color: "bg-pink-300/10",
            textColor: "text-pink-300"
        },
        {
            name: "Chart",
            icon: <IconChartBar className="size-5" />,
            color: "bg-indigo-300/10",
            textColor: "text-indigo-300"
        }
    ]

const Hub = () => {
    const { openItem, openModal, closeModal, onCustomClick } = useHub();
    return <>
        {
            HubTypes.map((hub) => {
                const ModalComponent = hub.modal;
                if (!ModalComponent) return null;
                return <ModalComponent key={hub.name} open={openItem === hub.name} onClose={closeModal} />
            })
        }

        <Card className="w-4/12 h-full">
            <CardContent className="flex flex-col justify-between h-full">
                <div className="flex flex-col">
                    <span className="mb-3 text-muted">
                        Hub
                    </span>
                    <div className="h-0.5 w-full bg-border" />
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {
                            HubTypes.map((item) => (
                                <div key={item.name} className={
                                    clsx(
                                        "flex w-full items-center justify-between h-14 rounded-3xl p-4",
                                        item.color,
                                        item.textColor,
                                        !item.implemented ? "opacity-50 cursor-not-allowed" : "opacity-90 cursor-pointer hover:opacity-100 hover:scale-103 transition-all"
                                    )
                                }
                                    onClick={() => {
                                        if (!item.implemented) return;
                                        openModal(item.name);
                                    }}
                                >
                                    <div className="flex flex-col gap-2">
                                        {item.icon}
                                        <span className="text-xs">{item.name}</span>
                                    </div>
                                    {
                                        item.supportCustomize && (
                                            <Button
                                                onClick={
                                                    () => onCustomClick(item.name)
                                                }
                                                isIconOnly variant="tertiary" size="sm" className={"rounded-full bg-white/5 hover:scale-105 transition-all"}>
                                                <Edit2Icon className="size-3 text-white" />
                                            </Button>
                                        )
                                    }
                                </div>
                            ))
                        }
                    </div>
                    <div>
                    </div>
                </div>
            </CardContent>
        </Card >
    </>
}

export default Hub  