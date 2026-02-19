import useAppStore from "../store/app";

const useTTS = () => {
    const { localTTS } = useAppStore();

    return {
        localTTS,
    }
}

export default useTTS
