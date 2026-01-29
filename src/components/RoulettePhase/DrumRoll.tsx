import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { motion, useAnimate, useMotionValue } from "framer-motion";
import { Participant } from "@/types";
import { cn } from "@/lib/utils";
import { useSoundManager } from "@/hooks/useSoundManager";

interface DrumRollProps {
    participants: Participant[];
    itemHeight?: number;
    containerHeight?: number; // Added
    onSpinStart?: () => void;
    onSpinStop?: () => void;
}

export interface DrumRollHandle {
    spin: () => void;
    stop: (winnerIndex: number) => Promise<void>;
}

// Ensure enough copies for seamless looping and long deceleration
const COPIES = 50;

export const DrumRoll = forwardRef<DrumRollHandle, DrumRollProps>(
    ({ participants, itemHeight = 80, containerHeight = 184, onSpinStart, onSpinStop }, ref) => {
        // We use `useAnimate` for imperative control of the sequence
        const [scope, animate] = useAnimate();
        const [displayList, setDisplayList] = useState<Participant[]>([]);
        const [isSpinning, setIsSpinning] = useState(false);
        const sound = useSoundManager();

        // Initial List Setup
        useEffect(() => {
            let base = participants;
            if (base.length === 0) return;

            // Ensure we have a substantial list to allow for "infinite" feeling without frequently resetting
            // But for linear loop, we technically only need 2 sets if we reset perfectly.
            // However, for the deceleration phase which might travel far, we construct a longer list.
            const list: Participant[] = [];
            for (let i = 0; i < COPIES; i++) {
                list.push(...base);
            }
            setDisplayList(list);
        }, [participants]);

        const spin = async () => {
            if (participants.length === 0) return;
            onSpinStart?.();
            setIsSpinning(true);

            // Reset sound rate and play
            sound.setRate("spin", 1.0);
            sound.play("spin");

            // 1. Infinite Linear Loop
            // We animate from 0 to -(TotalHeight of 1 set). 
            // When it reaches end, it snaps back to 0 seamlessly (because list is repeated).
            const oneSetHeight = participants.length * itemHeight;
            const totalHeight = displayList.length * itemHeight;

            // Reset Y to 0 immediately to ensure clean start
            // Note: If we are already deep down, this might jump. 
            // But typically we restart from a fresh state or we can accept the jump as "Start".
            // To be smoother, we could use `y % oneSetHeight` but simpler is robust.
            await animate(scope.current, { y: 0 }, { duration: 0 });

            // Run infinite loop animation
            // Duration: Adjust for speed. e.g. 50ms per item -> 0.05s * count
            // Let's aim for very fast: 2000px/s?
            const duration = oneSetHeight / 2000;

            await animate(scope.current, { y: -oneSetHeight }, {
                duration: duration < 0.2 ? 0.2 : duration, // Cap max speed
                ease: "linear",
                repeat: Infinity,
                onUpdate: (latest) => {
                    // Optional: check bounds logic if manually doing looping, but 'repeat: Infinity' works great
                }
            });
        };

        const stop = async (winnerIndex: number) => {
            if (!paramsRef.current.isSpinning) return;

            // Stop the infinite loop immediately
            animate(scope.current, { y: scope.current.style.y }, { duration: 0 }); // Halt

            const domMatrix = new DOMMatrix(getComputedStyle(scope.current).transform);
            const actualY = domMatrix.m42;

            // Current index based on position
            const currentIndexExact = Math.abs(actualY) / itemHeight;
            const currentIndexFloor = Math.floor(currentIndexExact);

            const RATCHET_COUNT = 6; // Increased slightly
            const SMOOTH_BUFFER_SETS = 2; // Increased buffer for smooth transition

            const minDistanceItems = (SMOOTH_BUFFER_SETS * participants.length) + RATCHET_COUNT;
            const minTargetIndex = currentIndexFloor + minDistanceItems;

            const remainder = minTargetIndex % participants.length;
            const diffToWinner = (winnerIndex - remainder + participants.length) % participants.length;
            const targetAbsoluteIndex = minTargetIndex + diffToWinner;

            const CENTER_OFFSET = containerHeight / 2 - itemHeight / 2;
            const getTargetY = (index: number) => - (index * itemHeight) + CENTER_OFFSET;

            // --- PHASE 1: SMOOTH TRANSITION (Deceleration) ---
            // Stop constant spin sound and switch to position-based ticking
            sound.stop("spin");

            // From current speed to a slower, manageable speed.
            const ratchetStartIndex = targetAbsoluteIndex - RATCHET_COUNT;
            const transitionTargetY = getTargetY(ratchetStartIndex - 1);

            // Track last tick position to avoid double triggering
            let lastTickY = actualY;

            // Calculate distance to travel for transition
            await animate(scope.current, { y: transitionTargetY }, {
                duration: 1.5, // Reduced from 2.0s as requested (faster overall)
                ease: "circOut", // Smooth braking
                onUpdate: (latest) => {
                    // Trigger sound every itemHeight
                    const currentY = parseFloat(latest.toString());
                    const diff = Math.abs(currentY - lastTickY);
                    if (diff >= itemHeight) {
                        sound.play("tick");
                        lastTickY = currentY; // Reset to current anchor
                        // Or better: align to grid
                        // lastTickY = Math.floor(currentY / itemHeight) * itemHeight; 
                        // But simple diff is robust enough for visual sync feel.
                    }
                }
            });

            // --- PHASE 2: RATCHET (Mechanical Steps) ---
            for (let i = ratchetStartIndex; i < targetAbsoluteIndex; i++) {
                sound.play("tick");

                await animate(scope.current, { y: getTargetY(i) }, {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    duration: 0.2
                });

                // Pause for mechanical feel - Reduced duration for speed
                await new Promise(r => setTimeout(r, 120));
            }

            // --- PHASE 3: TEASE (Overshoot) ---
            sound.play("tick"); // Final slot enty
            const winnerY = getTargetY(targetAbsoluteIndex);

            // Overshoot by 70% 
            const overshootY = winnerY - (itemHeight * 0.7);

            await animate(scope.current, { y: overshootY }, {
                duration: 1.0, // Reduced from 1.5s
                ease: "easeOut"
            });

            await new Promise(r => setTimeout(r, 300)); // Reduced pause

            // --- PHASE 4: ROLLBACK ---
            // Play "Boing" sound here for the elastic return
            sound.play("stop");

            await animate(scope.current, { y: winnerY }, {
                type: "spring",
                stiffness: 600,
                damping: 15,
                mass: 1.2
            });

            setIsSpinning(false);
            onSpinStop?.();
        };

        // Helper to keep track of spinning state for stop guard
        const paramsRef = useRef({ isSpinning: false });
        useEffect(() => { paramsRef.current.isSpinning = isSpinning; }, [isSpinning]);

        // Optional: Sound Trigger callback helper could be passed as prop or handled in parent via onProgress
        // For now we assume sound handling is simpler in parent or global.
        const soundTrigger = () => {
            // Can verify if we should emit sound here or if parent handles loops.
            // The Ratchet implies discrete sounds. 
            // We could dispatch event or callback.
        };

        useImperativeHandle(ref, () => ({
            spin,
            stop
        }));

        return (
            <div
                className={cn(
                    "relative w-full max-w-sm mx-auto overflow-hidden bg-black/40 rounded-xl border-4 border-gold shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
                )}
                style={{ height: containerHeight }}
            >
                {/* Highlight Line / Payline - Center */}
                <div
                    className="absolute top-1/2 left-0 w-full -translate-y-1/2 bg-gold/10 border-y-2 border-gold/50 z-10 pointer-events-none backdrop-blur-[1px]"
                    style={{ height: itemHeight + 4 }} // Slightly larger than item
                />

                {/* Shadow Gradients for depth */}
                <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-black/80 to-transparent z-10" />
                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black/80 to-transparent z-10" />

                <div ref={scope} className="w-full flex flex-col items-center">
                    {displayList.map((p, i) => (
                        <div
                            key={`${p.id}-${i}`}
                            className="flex items-center justify-center w-full"
                            style={{ height: itemHeight }}
                        >
                            <span className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider font-cinzel text-shadow-glow">
                                {p.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
);

DrumRoll.displayName = "DrumRoll";
