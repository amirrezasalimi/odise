import { LINKS } from "@/shared/constants/links";
import { useUIStore } from "@/shared/store/ui";
import { Button } from "@heroui/react";
import { IconNotebook } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, PlusIcon, Settings2 } from "lucide-react";

export const Header = () => {
    const toggleConfigModal = useUIStore((state) => state.toggleConfigModal);

    return (
        <div className="h-10 flex items-center  justify-between">
            <div className="flex items-center gap-4">
                <Link to={LINKS.dashboard}>
                    <ArrowLeft className="size-6" />
                </Link>
                <div className="flex items-center gap-2">
                    <IconNotebook className="size-6" />
                    <h2>
                        Notebook 21
                    </h2>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="primary">
                    <PlusIcon className="size-4" />
                    Create Notebook
                </Button>
                <Button variant="ghost" onPress={() => toggleConfigModal(true)}>
                    <Settings2 />
                </Button>
            </div>

        </div>
    )
}