"use client";

import { useCallback, useEffect } from "react";
import { Howl } from "howler";

// Placeholder sounds - in a real app these would be local files or valid URLs
const SOUNDS = {
    spin: new Howl({ src: ['https://actions.google.com/sounds/v1/machines/motor_spinning.ogg'], loop: true, volume: 0.5 }), // Placeholder
    stop: new Howl({ src: ['https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg'], volume: 1.0 }), // Placeholder for "spring" stop
    win: new Howl({ src: ['https://actions.google.com/sounds/v1/crowds/battle_crowd_celebrate_stutter.ogg'], volume: 1.0 }), // Placeholder fanfar
    add: new Howl({ src: ['https://actions.google.com/sounds/v1/cartoon/pop.ogg'], volume: 0.5 }),
    click: new Howl({ src: ['https://actions.google.com/sounds/v1/ui/click.ogg'], volume: 0.3 }),
    tick: new Howl({ src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABBTZGF0YQQAAAAAAA=='], volume: 0.5 }), // Dummy for types
};

// Web Audio API Context (Singleton)
let audioCtx: AudioContext | null = null;

const getAudioCtx = () => {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
};


// Synth helper for "Tick" sound (Mechanical Click)
const playTick = (ctx: AudioContext) => {
    const t = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.01;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.01);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
};

export function useSoundManager() {
    const play = useCallback((key: keyof typeof SOUNDS) => {
        if (key === 'spin') {
            // Use Synth for Spin!
            startSpinSound();
        } else if (key === 'tick') {
            // Direct trigger for synced animation
            const ctx = getAudioCtx();
            if (ctx) {
                if (ctx.state === 'suspended') ctx.resume();
                playTick(ctx);
            }
        } else if (key === 'win') {
            // Play fanfare but limit duration (User requested ~5.5s total)
            const id = SOUNDS[key].play();
            // Reset volume in case it was faded out
            SOUNDS[key].volume(1.0, id);

            // Fade out after 5000ms (5.0s)
            setTimeout(() => {
                if (SOUNDS[key].playing(id)) {
                    SOUNDS[key].fade(1.0, 0, 500, id); // Fade out over 500ms -> Ends at 5.5s
                }
            }, 5000);
        } else {
            SOUNDS[key].play();
        }
    }, []);

    const stop = useCallback((key: keyof typeof SOUNDS) => {
        if (key === 'spin') {
            stopSpinSound();
        } else if (key === 'tick') {
            // No-op
        } else {
            SOUNDS[key].stop();
        }
    }, []);

    const setRate = useCallback((key: keyof typeof SOUNDS, rate: number) => {
        if (key === 'spin') {
            setSpinRate(rate);
        } else {
            SOUNDS[key].rate(rate);
        }
    }, []);

    // Ensure spin stops on unmount
    useEffect(() => {
        return () => {
            stopSpinSound();
        };
    }, []);

    // --- Synth Spin Logic Ref ---
    // We use a ref-like global or module scope var for interval since hook re-renders shouldn't kill it.
    // Ideally this should be inside a useEffect or ref, but for simplicity in this file:
    // We can't really use module vars safely if multiple components use this hook.
    // But sound manager is usually a singleton or context.
    // Let's use `useRef` if we were inside a component, but this is a hook.
    // For now, let's stick to module-level vars for the "Spin Ticker" assuming one active roulette at a time.

    return { play, stop, setRate };
}

// Module-level ticker state (Simple Singleton for this app)
let spinIntervalId: NodeJS.Timeout | null = null;
let currentRate = 1.0;
let baseInterval = 100; // ms

const startSpinSound = () => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    if (spinIntervalId) clearInterval(spinIntervalId);

    const runTick = () => {
        playTick(ctx);
    };

    // Initial run
    runTick();

    // Start loop
    // Note: To support dynamic rate, we might need a recursive timeout instead of interval.
    // Let's try recursive timeout for smooth rate changes.
    tickLoop(ctx);
};

const tickLoop = (ctx: AudioContext) => {
    if (spinIntervalId) clearTimeout(spinIntervalId); // Clear potential previous

    // Check if we should stop? Logic inside stop() clears the ID variable or flag?
    // We need a flag.
    // Let's use spinIntervalId as the "Active" flag/holder.

    // Actually, `startSpinSound` sets a flag.
    // Let's start a recursive timeout.

    const nextDelay = baseInterval / currentRate;

    spinIntervalId = setTimeout(() => {
        playTick(ctx);
        if (spinIntervalId) { // If still active
            tickLoop(ctx);
        }
    }, nextDelay);
};

const stopSpinSound = () => {
    if (spinIntervalId) {
        clearTimeout(spinIntervalId);
        spinIntervalId = null;
    }
};

const setSpinRate = (rate: number) => {
    // Clamp rate?
    currentRate = Math.max(0.1, rate);
};

