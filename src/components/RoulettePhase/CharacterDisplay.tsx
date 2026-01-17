import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type CharacterState = "normal" | "surprised" | "win";

interface CharacterDisplayProps {
    state: CharacterState;
    isRigged?: boolean;
}

const getImageSrc = (state: CharacterState, isRigged?: boolean) => {
    if (isRigged && state !== "win") return "/mega_rigged.png"; // Show rigged image unless winning (or maybe even when winning? User said "Top screen character")
    // User said: "Switch ... to rigged image ... when Rigged Mode is ON."
    // "Reset ... when released". 
    // Usually God Mode is on during spin until stop.
    // Let's prioritize Rigged image during Normal/Surprised if isRigged is true.

    switch (state) {
        case "surprised": return "/mega_surprised.png"; // Maybe keep surprised? Or Rigged overrides?
        // Requirement: "Switch from Normal to Guts Pose".
        // Let's assume Rigged overrides Normal.
        // If Surprised (Stop phase), maybe keep Rigged or switch to Surprised?
        // "Guts pose" suggests confidence. Maybe keep it until Win?
        // Let's make it override 'normal' and 'surprised' for now to show "I am in control".
        case "win": return "/mega_win.png";
        case "normal": default: return isRigged ? "/mega_rigged.png" : "/mega_normal.png";
    }
};

export function CharacterDisplay({ state, isRigged }: CharacterDisplayProps) {
    return (
        <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto z-20">
            <AnimatePresence mode="wait">
                <motion.div
                    key={state + (isRigged ? "_rigged" : "")}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        rotate: state === "normal" ? [0, -2, 2, 0] : state === "surprised" ? [-1, 1, -1] : 0
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                        opacity: { duration: 0.2 },
                        rotate: { repeat: Infinity, duration: state === "surprised" ? 0.1 : 2, repeatType: "reverse" }
                    }}
                    className="relative w-full h-full"
                >
                    <Image
                        src={getImageSrc(state, isRigged)}
                        alt="Mega Character"
                        fill
                        className="object-contain drop-shadow-2xl"
                        priority
                    />
                </motion.div>
            </AnimatePresence>

            {/* Light glow effect behind character */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gold/20 blur-3xl rounded-full -z-10 animate-pulse" />
        </div>
    );
}
