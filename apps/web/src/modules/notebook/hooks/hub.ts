import { useState } from "react";

const useHub = () => {
    const [openItem, setOpenItem] = useState<string | null>(null);

    const openModal = (item: string) => {
        setOpenItem(item);
    }

    const closeModal = () => {
        setOpenItem(null);
    }

    const onCustomClick = (item: string) => {
    }

    return {
        openItem,
        onCustomClick,
        closeModal,
        openModal,
    }
}


export default useHub;