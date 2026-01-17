import { motion, AnimatePresence } from "framer-motion";
import { Participant } from "@/types";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NameListProps {
    participants: Participant[];
    onRemove: (id: string) => void;
    emptyMessage?: string;
}

export function NameList({ participants, onRemove, emptyMessage = "参加者がまだいません" }: NameListProps) {
    return (
        <div className="w-full max-h-60 overflow-y-auto px-2 glass-panel rounded-xl mt-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {participants.length === 0 && (
                <div className="p-4 text-center text-white/50">
                    {emptyMessage}
                </div>
            )}
            <ul className="flex flex-col gap-2 p-2">
                <AnimatePresence initial={false} mode="popLayout">
                    {participants.map((person) => {
                        // Support both hasWon (Participant) and isWon (Prize) keys
                        const isWinner = person.hasWon || (person as any).isWon;

                        return (
                            <motion.li
                                key={person.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                animate={{ opacity: isWinner ? 0.6 : 1, scale: 1, x: 0, filter: isWinner ? "grayscale(0.5)" : "none" }}
                                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border group relative overflow-hidden",
                                    isWinner
                                        ? "bg-gold/10 border-gold/30"
                                        : "bg-white/5 hover:bg-white/10 border-white/5"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn("font-bold text-lg font-inter transition-colors", isWinner ? "text-gold" : "text-white")}>
                                        {person.name}
                                    </span>
                                    {isWinner && (
                                        <span className="text-[10px] font-bold bg-gold text-black px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                                            WINNER
                                        </span>
                                    )}
                                </div>

                                {!isWinner && (
                                    <button
                                        onClick={() => onRemove(person.id)}
                                        className="text-white/30 hover:text-red-400 transition-colors p-1"
                                        aria-label="Remove"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </motion.li>
                        );
                    })}
                </AnimatePresence>
            </ul>
        </div>
    );
}
