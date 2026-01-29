import { useEffect } from "react";
import { motion } from "framer-motion";
import { Participant } from "@/types";
import { Button } from "@/components/ui/Button";
import { WinnerOverlay } from "./WinnerOverlay";
import { triggerConfetti, triggerWinnerBurst } from "@/lib/effects";
import { useSoundManager } from "@/hooks/useSoundManager";
import { RotateCcw } from "lucide-react";

interface ResultScreenProps {
    winner: Participant;
    onReset: () => void;
    customActions?: React.ReactNode;
    title?: string;
    subTitle?: string;
}

export function ResultScreen({ winner, onReset, customActions, title, subTitle }: ResultScreenProps) {
    const sound = useSoundManager();

    useEffect(() => {
        sound.play("win");
        triggerWinnerBurst();
        triggerConfetti();
    }, [sound]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center relative" // Ensure full height for centering
        >
            <WinnerOverlay winner={winner} title={title} subTitle={subTitle} />

            {/* Controls - Positioned at bottom but z-index high */}
            {/* Controls - Positioned at bottom but z-index high */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-6 z-[60] pointer-events-auto flex flex-col items-center gap-2"
            >
                {customActions ? customActions : (
                    <Button onClick={onReset} variant="secondary" size="md" className="flex items-center gap-2">
                        <RotateCcw /> RESET
                    </Button>
                )}
            </motion.div>
        </motion.div>
    );
}
