import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Participant } from "@/types";
import { Button } from "@/components/ui/Button";
import { CharacterDisplay } from "./CharacterDisplay";
import { DrumRoll, DrumRollHandle } from "./DrumRoll";
import { useSoundManager } from "@/hooks/useSoundManager";
import { ArrowLeft } from "lucide-react";

interface RouletteScreenProps {
    participants: Participant[];
    onFinish: (winner: Participant) => void;
    onBack?: () => void;
}

export function RouletteScreen({ participants, onFinish, onBack }: RouletteScreenProps) {
    const [spinning, setSpinning] = useState(false);
    const [characterState, setCharacterState] = useState<"normal" | "surprised" | "win">("normal");
    const drumRef = useRef<DrumRollHandle>(null);
    const sound = useSoundManager();

    // God Mode logic
    const [godMode, setGodMode] = useState(false);

    // Handle double click for God Mode
    const handleDoubleClick = () => {
        setGodMode(prev => !prev);
        sound.play("click");
    };

    const startSpin = () => {
        setSpinning(true);
        setCharacterState("normal"); // Or keep normal rhythm
        sound.play("spin");
        drumRef.current?.spin();
    };

    const stopSpin = async () => {
        // 1. Decide winner
        let winnerIndex = Math.floor(Math.random() * participants.length);

        // God Mode Override
        if (godMode) {
            // Priority: Exact match "女鹿社長" -> Partial "女鹿" -> Partial "社長" -> Index 0
            let megaIndex = participants.findIndex(p => p.name === "女鹿社長");

            if (megaIndex === -1) {
                megaIndex = participants.findIndex(p => p.name.includes("女鹿"));
            }
            if (megaIndex === -1) {
                megaIndex = participants.findIndex(p => p.name.includes("社長"));
            }

            if (megaIndex >= 0) {
                winnerIndex = megaIndex;
            } else {
                // Fallback if no Mega found: Pick the first one (usually the host/main user)
                winnerIndex = 0;
            }
        }

        const winner = participants[winnerIndex];

        // 2. Change Character
        setCharacterState("surprised");

        // 3. Request Stop animation
        // Stop sound loop handled by manager but we might want a "landing" sound later
        // sound.stop("spin"); // Ideally fade out or continue until land?
        // Requirement: "Stop action: pass through and return". Sound sync is tricky.
        // Let's keep spin sound until actual stop.

        if (drumRef.current) {
            await drumRef.current.stop(winnerIndex);
        }

        // 4. Finish
        sound.stop("spin");
        // sound.play("stop"); // Moved to DrumRoll for better sync with animation
        setCharacterState("win");
        await new Promise(r => setTimeout(r, 500)); // Reduced from 1000ms
        onFinish(winner);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-4 w-full h-full relative"
        >
            {/* Back Button */}
            {!spinning && onBack && (
                <div className="absolute top-0 left-0 z-50 p-2">
                    <Button
                        onClick={onBack}
                        variant="secondary"
                        size="sm"
                        className="bg-black/20 hover:bg-black/40 text-white/50 hover:text-white border-none flex items-center gap-2"
                    >
                        <ArrowLeft size={20} /> <span className="hidden sm:inline">← 戻る</span>
                    </Button>
                </div>
            )}

            <div
                onDoubleClick={handleDoubleClick}
                className="cursor-pointer select-none"
                title="Mega Character"
            >
                <CharacterDisplay state={characterState} isRigged={godMode} />
                {/* God Mode Indicator (Subtle) - Maybe remove if image is enough? Keeping both for debug/clarity */}
                {godMode && <div className="w-1 h-1 bg-red-500 rounded-full mx-auto mt-2 opacity-50" />}
            </div>

            <div className="w-full max-w-md flex-1 flex items-center justify-center min-h-0">
                <DrumRoll
                    ref={drumRef}
                    participants={participants}
                    itemHeight={60}
                    containerHeight={140}
                />
            </div>

            <div className="pt-2 z-20 pb-4">
                {!spinning ? (
                    <Button
                        size="lg"
                        onClick={startSpin}
                        className="w-48 text-xl animate-bounce"
                        style={{ animationDuration: "2s" }}
                    >
                        SPIN
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        variant="danger"
                        onClick={stopSpin}
                        className="w-48 text-xl"
                    >
                        STOP
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
