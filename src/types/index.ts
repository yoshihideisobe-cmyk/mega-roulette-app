export type Phase =
    | 'ENTRY'
    | 'ROULETTE'
    | 'RESULT'
    | 'PRIZE_ENTRY'
    | 'PRIZE_ROULETTE'
    | 'PRIZE_RESULT';

export interface Participant {
    id: string;
    name: string;
    hasWon?: boolean; // Persisted flag
}

export interface Prize {
    id: string;
    name: string;
    isWon?: boolean;
}

export type SoundEffect = 'spin' | 'stop' | 'win' | 'add' | 'click';
