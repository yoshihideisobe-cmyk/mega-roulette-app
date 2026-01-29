"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Phase, Participant, Prize } from "@/types";
import { EntryScreen } from "@/components/EntryPhase/EntryScreen";
import { RouletteScreen } from "@/components/RoulettePhase/RouletteScreen";
import { ResultScreen } from "@/components/ResultPhase/ResultScreen";
import { usePersistence } from "@/hooks/usePersistence";
import { Button } from "@/components/ui/Button";

// Reusing Entry/Roulette screens for Prize Phase since logic is similar.
// We can pass different props or wrap them. For simplicity, we adapt them or create wrappers if needed.
// Actually, `EntryScreen` expects `Participant[]`. `Prize` has same shape (id, name).
// Converting types slightly or casting is okay if structure matches.
// Let's create specific wrappers or just use them if types overlap enough.
// `Participant` has `hasWon`. `Prize` has `isWon`.
// Let's just Map Prize to Participant for the components to save time, or refactor components to be generic.
// Mapping is safer.

const DEFAULT_PRIZES: Prize[] = [
  { id: "p1", name: "商品券1万円" },
  { id: "p2", name: "ふ陸70周年記念サコシュ" },
  { id: "p3", name: "ふ陸70周年記念サコシュ" },
  { id: "p4", name: "女鹿社長へのお祝いスピーチ3分" },
];

export default function Home() {
  const [phase, setPhase] = usePersistence<Phase>("mega_phase", "ENTRY");
  const [participants, setParticipants] = usePersistence<Participant[]>("mega_participants", []);
  const [prizes, setPrizes] = usePersistence<Prize[]>("mega_prizes", DEFAULT_PRIZES);

  // Current winner state (Roulette 1 and 2)
  const [participantWinner, setParticipantWinner] = useState<Participant | null>(null);
  const [prizeWinner, setPrizeWinner] = useState<Prize | null>(null);

  // Restore winner from local state if needed? 
  // Maybe just keep in memory for session. If reload during result, might lose winner overlay.
  // Requirement says "Keep session". 
  // Let's persist winners too for safety? Or just Phase is enough for now.
  // If we are in RESULT phase, we need the winner.
  const [persistedParticipantWinner, setPersistedParticipantWinner] = usePersistence<Participant | null>("mega_winner_part", null);
  const [persistedPrizeWinner, setPersistedPrizeWinner] = usePersistence<Prize | null>("mega_winner_prize", null);

  useEffect(() => {
    if (persistedParticipantWinner) setParticipantWinner(persistedParticipantWinner);
    if (persistedPrizeWinner) setPrizeWinner(persistedPrizeWinner);
  }, []);

  useEffect(() => {
    setPersistedParticipantWinner(participantWinner);
  }, [participantWinner]);

  useEffect(() => {
    setPersistedPrizeWinner(prizeWinner);
  }, [prizeWinner]);


  // --- HANDLERS ---

  const handleEntryStart = (list: Participant[]) => {
    setParticipants(list);
    setPhase("ROULETTE");
  };

  const handleRouletteFinish = (winner: Participant) => {
    setParticipantWinner(winner);
    // Mark as won
    const updated = participants.map(p => p.id === winner.id ? { ...p, hasWon: true } : p);
    setParticipants(updated);
    setPhase("RESULT");
  };

  const handleRestart = () => {
    setParticipantWinner(null);
    setPhase("ROULETTE");
  }

  const handleGoToPrize = () => {
    setPhase("PRIZE_ENTRY");
  }

  const handlePrizeEntryStart = (list: any[]) => {
    // Convert/Save prizes
    const newPrizes = list.map(p => ({ id: p.id, name: p.name, isWon: p.isWon || false }));
    setPrizes(newPrizes);
    setPhase("PRIZE_ROULETTE");
  }

  const handlePrizeFinish = (winner: Participant) => {
    // Winner here comes from DrumRoll as Participant type
    const wonPrize = { id: winner.id, name: winner.name, isWon: true };
    setPrizeWinner(wonPrize);

    const updated = prizes.map(p => p.id === winner.id ? { ...p, isWon: true } : p);
    setPrizes(updated);
    setPhase("PRIZE_RESULT");
  }

  const handleResetAll = () => {
    setParticipantWinner(null);
    setPrizeWinner(null);
    setPhase("ENTRY");
    // Note: Participants list remains as per "Persistence" check.
    // "Reset" button in result usually goes back to Entry.
  };

  const handleBackToEntry = () => {
    setPhase("ENTRY");
  };

  const handleClearParticipants = () => {
    if (confirm("全ての参加者を削除してもよろしいですか？")) {
      setParticipants([]);
    }
  };

  const handleClearPrizes = () => {
    if (confirm("全ての商品を削除してもよろしいですか？")) {
      setPrizes(DEFAULT_PRIZES); // Reset to default or empty? "Clear" usually means empty?
      // User said "Default list as initial". 
      // Let's reset to default.
    }
  }


  // Filters for Roulette (exclude winners)
  const activeParticipants = participants.filter(p => !p.hasWon);
  const activePrizes = prizes.filter(p => !p.isWon);

  // Adapt Prizes to Participants for components
  // Map 'isWon' to 'hasWon' so NameList can detect it properly via the existing Participant type interface (or check logic)
  const prizesAsParticipants = prizes.map(p => ({ id: p.id, name: p.name, hasWon: p.isWon }));
  const activePrizesAsParticipants = activePrizes.map(p => ({ id: p.id, name: p.name }));

  return (
    <main className="h-[100dvh] w-full relative overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#0f172a] to-navy z-0" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 z-0 pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-10 w-full max-w-4xl mx-auto h-full flex items-center justify-center">
        <AnimatePresence mode="wait">

          {/* PHASE 1: PARTICIPANT ENTRY */}
          {phase === "ENTRY" && (
            <EntryScreen
              key="entry"
              onStart={handleEntryStart}
              initialParticipants={participants}
              onClearAll={handleClearParticipants}
              resetLabel="参加者リストをリセット"
            />
          )}

          {/* PHASE 2: PARTICIPANT ROULETTE */}
          {phase === "ROULETTE" && (
            <RouletteScreen
              key="roulette"
              participants={activeParticipants.length > 0 ? activeParticipants : participants} // Fallback if all won?
              onFinish={handleRouletteFinish}
              onBack={handleBackToEntry}
            />
          )}

          {/* PHASE 3: PARTICIPANT RESULT */}
          {phase === "RESULT" && participantWinner && (
            <ResultScreen
              key="result"
              winner={participantWinner}
              onReset={handleResetAll}
              // We need to inject new buttons here. 
              // ResultScreen needs update to support "Next Phase" or "Restart"
              customActions={
                <div className="flex flex-col items-center gap-4 mt-8 w-full">
                  <div className="flex gap-4 justify-center">
                    {/* Restart - Consistent with Secondary style */}
                    <Button onClick={handleRestart} variant="secondary" size="md">
                      もう一度まわす
                    </Button>
                    {/* Next - Consistent with Primary (Gold) style */}
                    <Button onClick={handleGoToPrize} variant="primary" size="md" className="animate-pulse">
                      商品抽選へ進む
                    </Button>
                  </div>

                  {/* Back to Home - Tertiary/Quiet style */}
                  <button
                    onClick={handleResetAll}
                    className="text-white/40 hover:text-white hover:underline text-sm transition-colors mt-2"
                  >
                    TOP（参加者登録）に戻る
                  </button>
                </div>
              }
            />
          )}

          {/* PHASE 4: PRIZE ENTRY */}
          {phase === "PRIZE_ENTRY" && (
            <EntryScreen
              key="prize_entry"
              title="PRIZE SELECTION"
              placeholder="商品・権利を追加..."
              onStart={handlePrizeEntryStart}
              initialParticipants={prizesAsParticipants}
              onClearAll={handleClearPrizes}
              submitLabel="START PRIZE ROULETTE"
              emptyMessage="景品が登録されていません"
              resetLabel="商品リストをリセット"
              onBack={handleBackToEntry}
            />
          )}

          {/* PHASE 5: PRIZE ROULETTE */}
          {phase === "PRIZE_ROULETTE" && (
            <RouletteScreen
              key="prize_roulette"
              participants={activePrizesAsParticipants.length > 0 ? activePrizesAsParticipants : prizesAsParticipants}
              onFinish={handlePrizeFinish}
              onBack={handleGoToPrize} // Reuse handleGoToPrize as "Back to Prize Entry"
            />
          )}

          {/* PHASE 6: PRIZE RESULT */}
          {phase === "PRIZE_RESULT" && prizeWinner && (
            <ResultScreen
              key="prize_result"
              winner={prizeWinner as Participant} // Cast safe due to structure
              onReset={handleResetAll}
              title="CONGRATULATIONS!" // Or "YOU GOT..."
              subTitle="獲得商品"
            />
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}

