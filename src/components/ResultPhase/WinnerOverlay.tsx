import { motion } from "framer-motion";
import { Participant } from "@/types";

interface WinnerOverlayProps {
    winner: Participant;
    title?: string;
    subTitle?: string;
}

export function WinnerOverlay({ winner, title = "Congratulations!", subTitle }: WinnerOverlayProps) {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
            {/* Background flash */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-white"
            />

            <motion.div
                initial={{ scale: 0, rotate: -10, y: 100, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                    delay: 0.2
                }}
                className="relative flex flex-col items-center"
            >
                <h2 className="text-4xl md:text-5xl text-white font-bold text-shadow-glow text-center mb-4 uppercase tracking-widest">
                    {title}
                </h2>
                {subTitle && (
                    <h3 className="text-2xl text-gold font-bold mb-2 tracking-wider drop-shadow-md">
                        {subTitle}
                    </h3>
                )}
                <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#ffd700] via-[#fff] to-[#ffd700] drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] stroke-black text-center p-4">
                    {winner.name}
                </h1>
            </motion.div>
        </div>
    );
}
