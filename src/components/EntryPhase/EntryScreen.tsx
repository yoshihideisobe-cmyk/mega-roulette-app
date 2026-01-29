import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { NameList } from "./NameList";
import { Participant } from "@/types";
import { Play, ArrowLeft } from "lucide-react";
import { useSoundManager } from "@/hooks/useSoundManager";

interface EntryScreenProps {
    onStart: (participants: Participant[]) => void;
    initialParticipants?: Participant[];
    onClearAll?: () => void;
    title?: string;
    placeholder?: string;
    submitLabel?: string;
    emptyMessage?: string;
    resetLabel?: string;
    onBack?: () => void; // Added
}

export function EntryScreen({
    onStart,
    initialParticipants = [],
    onClearAll,
    title = "ENTRY PHASE",
    placeholder = "参加者名を入力...",
    submitLabel = "START ROULETTE",
    emptyMessage,
    resetLabel = "リストをリセット",
    onBack,
}: EntryScreenProps) {
    const [name, setName] = useState("");
    const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
    const sound = useSoundManager();

    // Sync with parent prop if it changes (though usually valid on mount)
    // But since we manage local state for additions, we should be careful.
    // Actually, parent holds master list. When Coming BACK, we init from it.

    // Update parent when adding/removing? 
    // The current architecture: page.tsx holds participants only after "handleEntryStart".
    // Before that, EntryScreen holds it.
    // BUT the user wants PERSISTENCE. So page.tsx held the list from previous run.
    // So we init state from that.


    const handleAdd = () => {
        if (!name.trim()) return;
        const newPerson: Participant = {
            id: crypto.randomUUID(),
            name: name.trim(),
        };
        setParticipants((prev) => [newPerson, ...prev]);
        setName("");
        sound.play("add");
    };

    const handleClearTrigger = () => {
        if (participants.length === 0) return;
        onClearAll?.();

        if (confirm("全てのリストを削除してもよろしいですか？")) {
            setParticipants([]);
            sound.play("click");
        }
    };

    const handleRemove = (id: string) => {
        setParticipants((prev) => prev.filter((p) => p.id !== id));
        sound.play("click"); // Reuse click for remove
    };

    const handleStart = () => {
        if (participants.length === 0) return;
        sound.play("click");
        onStart(participants);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            className="max-w-md w-full mx-auto p-2 relative" // Added relative
        >
            {/* Back Button for Prize Selection Phase */}
            {onBack && (
                <div className="absolute top-0 left-0 -translate-y-full mb-2 p-2 w-full flex justify-start">
                    <Button
                        onClick={onBack}
                        variant="secondary"
                        size="sm"
                        className="bg-transparent hover:bg-white/10 text-white/50 hover:text-white border-none flex items-center gap-2 pl-0"
                    >
                        <ArrowLeft size={16} /> <span>参加者登録へ戻る</span>
                    </Button>
                </div>
            )}

            <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
                <h1 className="text-3xl font-black text-center text-gradient-gold font-cinzel tracking-tight leading-none drop-shadow-lg">
                    MEGA ROULETTE<br />
                    <span className="text-sm tracking-widest text-white/80 font-inter font-normal">{title}</span>
                </h1>

                <div className="flex gap-2 items-end">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        placeholder={placeholder}
                        label="Name"
                        autoFocus
                    />
                    <Button onClick={handleAdd} size="md" className="mb-[2px]">
                        ADD
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden min-h-0">
                    <NameList participants={participants} onRemove={handleRemove} emptyMessage={emptyMessage} />
                </div>

                <div className="mt-2 flex flex-col gap-2 justify-center">
                    <Button
                        onClick={handleStart}
                        size="md"
                        variant="primary"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={participants.length === 0}
                    >
                        <Play fill="currentColor" /> {submitLabel}
                    </Button>

                    {participants.length > 0 && (
                        <button
                            onClick={handleClearTrigger}
                            className="text-xs text-white/30 hover:text-red-400 underline self-center transition-colors"
                        >
                            {resetLabel}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
