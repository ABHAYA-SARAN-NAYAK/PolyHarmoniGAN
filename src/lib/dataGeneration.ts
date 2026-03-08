// Seeded LCG pseudo-random number generator
class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0xffffffff;
    return (this.state >>> 0) / 0xffffffff;
  }
}

export interface Note {
  step: number;
  pitch: number;
  len: number;
}

export interface PianoRollData {
  drums: Note[];
  bass: Note[];
  piano: Note[];
  guitar: Note[];
  strings: Note[];
}

export const TRACK_NAMES = ['drums', 'bass', 'piano', 'guitar', 'strings'] as const;
export type TrackName = typeof TRACK_NAMES[number];

export const TRACK_COLORS: Record<TrackName, string> = {
  drums: '#e04848',
  bass: '#22d3a0',
  piano: '#4f8fff',
  guitar: '#34d399',
  strings: '#facc15',
};

interface TrackConfig {
  density: number;
  pitchMin: number;
  pitchMax: number;
  maxLen: number;
}

const TRACK_CONFIGS: Record<TrackName, TrackConfig> = {
  drums:   { density: 0.55, pitchMin: 36, pitchMax: 52, maxLen: 1 },
  bass:    { density: 0.25, pitchMin: 28, pitchMax: 48, maxLen: 4 },
  piano:   { density: 0.32, pitchMin: 48, pitchMax: 80, maxLen: 3 },
  guitar:  { density: 0.28, pitchMin: 40, pitchMax: 72, maxLen: 2 },
  strings: { density: 0.20, pitchMin: 52, pitchMax: 76, maxLen: 6 },
};

export function generatePianoRollData(bars: number = 4, seed: number = 42): PianoRollData {
  const totalSteps = bars * 32; // 32 steps per bar (32nd notes)
  const rng = new SeededRandom(seed);
  const data: PianoRollData = { drums: [], bass: [], piano: [], guitar: [], strings: [] };

  for (const trackName of TRACK_NAMES) {
    const cfg = TRACK_CONFIGS[trackName];
    const notes: Note[] = [];
    for (let step = 0; step < totalSteps; step++) {
      if (rng.next() < cfg.density) {
        const pitch = cfg.pitchMin + Math.floor(rng.next() * (cfg.pitchMax - cfg.pitchMin));
        const len = 1 + Math.floor(rng.next() * cfg.maxLen);
        notes.push({ step, pitch, len: Math.min(len, totalSteps - step) });
      }
    }
    data[trackName] = notes;
  }
  return data;
}

export function getModelSeed(model: string): number {
  switch (model) {
    case 'jamming': return 12345;
    case 'composer': return 67890;
    case 'hybrid': return 24680;
    default: return 42;
  }
}

export const MODEL_METRICS: Record<string, { harmonic: number; rhythm: number; variety: number; quality: number }> = {
  jamming: { harmonic: 72, rhythm: 88, variety: 91, quality: 76 },
  composer: { harmonic: 85, rhythm: 79, variety: 70, quality: 83 },
  hybrid: { harmonic: 91, rhythm: 93, variety: 85, quality: 89 },
};

export const GENERATION_LOGS = [
  'Initializing GAN model...',
  'Loading model weights...',
  'Sampling from latent space (256-dim)...',
  'Running generator forward pass...',
  'Applying multi-track conditioning...',
  'Post-processing note sequences...',
  'Validating harmonic consistency...',
  'Rendering piano roll data...',
  'Generation complete!',
];
