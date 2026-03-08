import { type PianoRollData, type TrackName, TRACK_NAMES } from './dataGeneration';

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class AudioEngineClass {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private convolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private trackGains: Record<TrackName, GainNode> = {} as any;
  private trackMuted: Record<TrackName, boolean> = { drums: false, bass: false, piano: false, guitar: false, strings: false };
  private trackVolumes: Record<TrackName, number> = { drums: 0.75, bass: 0.85, piano: 0.65, guitar: 0.55, strings: 0.5 };
  private isPlaying = false;
  private rafId: number | null = null;
  private startTime = 0;
  private totalDuration = 0;
  private onStepCb: ((step: number, progress: number) => void) | null = null;
  private onStopCb: (() => void) | null = null;
  private scheduledSources: (AudioBufferSourceNode | OscillatorNode)[] = [];

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext({ sampleRate: 44100 });

      // Master compressor for glue
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.value = -18;
      this.masterCompressor.knee.value = 12;
      this.masterCompressor.ratio.value = 4;
      this.masterCompressor.attack.value = 0.003;
      this.masterCompressor.release.value = 0.15;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.55;

      // Create reverb
      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this.createReverbIR(this.ctx, 2.2, 3.5);

      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.value = 0.18;

      this.dryGain = this.ctx.createGain();
      this.dryGain.gain.value = 0.85;

      // Routing: tracks → masterGain → dry + reverb → compressor → destination
      this.masterGain.connect(this.dryGain);
      this.masterGain.connect(this.convolver);
      this.convolver.connect(this.reverbGain);
      this.dryGain.connect(this.masterCompressor);
      this.reverbGain.connect(this.masterCompressor);
      this.masterCompressor.connect(this.ctx.destination);

      for (const t of TRACK_NAMES) {
        this.trackGains[t] = this.ctx.createGain();
        this.trackGains[t].gain.value = this.trackMuted[t] ? 0 : this.trackVolumes[t];
        this.trackGains[t].connect(this.masterGain);
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private createReverbIR(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const length = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buf;
  }

  play(noteData: PianoRollData, bpm: number, onStep?: (step: number, progress: number) => void, onStop?: () => void) {
    this.stop();
    const ctx = this.getCtx();

    for (const t of TRACK_NAMES) {
      if (!this.trackGains[t] || this.trackGains[t].context !== ctx) {
        this.trackGains[t] = ctx.createGain();
        this.trackGains[t].connect(this.masterGain!);
      }
      this.trackGains[t].gain.value = this.trackMuted[t] ? 0 : this.trackVolumes[t];
    }

    const stepDuration = (60 / bpm) / 8;
    const totalSteps = Math.max(...TRACK_NAMES.flatMap(t => noteData[t].map(n => n.step + n.len)), 128);
    this.totalDuration = totalSteps * stepDuration;
    this.startTime = ctx.currentTime;
    this.isPlaying = true;
    this.onStepCb = onStep || null;
    this.onStopCb = onStop || null;

    for (const track of TRACK_NAMES) {
      this.scheduleTrack(ctx, noteData[track], track, stepDuration);
    }

    const animate = () => {
      if (!this.isPlaying) return;
      const elapsed = ctx.currentTime - this.startTime;
      const progress = Math.min(elapsed / this.totalDuration, 1);
      const currentStep = Math.floor(elapsed / stepDuration);
      this.onStepCb?.(currentStep, progress);
      if (progress >= 1) {
        this.isPlaying = false;
        this.onStopCb?.();
        return;
      }
      this.rafId = requestAnimationFrame(animate);
    };
    this.rafId = requestAnimationFrame(animate);
  }

  private scheduleTrack(ctx: AudioContext, notes: PianoRollData[TrackName], track: TrackName, stepDur: number) {
    const gain = this.trackGains[track];
    const t0 = this.startTime;
    for (const note of notes) {
      const noteTime = t0 + note.step * stepDur;
      const noteDur = note.len * stepDur;
      switch (track) {
        case 'drums': this.scheduleDrum(ctx, gain, noteTime, note.pitch); break;
        case 'bass': this.scheduleBass(ctx, gain, noteTime, noteDur, note.pitch); break;
        case 'piano': this.schedulePiano(ctx, gain, noteTime, noteDur, note.pitch); break;
        case 'guitar': this.scheduleGuitar(ctx, gain, noteTime, noteDur, note.pitch); break;
        case 'strings': this.scheduleStrings(ctx, gain, noteTime, noteDur, note.pitch); break;
      }
    }
  }

  // ─── DRUMS: Layered, punchy, realistic ───
  private scheduleDrum(ctx: AudioContext, dest: GainNode, time: number, pitch: number) {
    const type = pitch % 4;
    if (type === 0) {
      // KICK: Sub layer + click transient
      const sub = ctx.createOscillator();
      const subG = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(160, time);
      sub.frequency.exponentialRampToValueAtTime(35, time + 0.07);
      sub.frequency.exponentialRampToValueAtTime(20, time + 0.3);
      subG.gain.setValueAtTime(1.0, time);
      subG.gain.linearRampToValueAtTime(0.7, time + 0.02);
      subG.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      sub.connect(subG).connect(dest);
      sub.start(time);
      sub.stop(time + 0.35);
      this.scheduledSources.push(sub);

      // Click transient
      const click = ctx.createOscillator();
      const clickG = ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(4500, time);
      click.frequency.exponentialRampToValueAtTime(300, time + 0.015);
      clickG.gain.setValueAtTime(0.4, time);
      clickG.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      click.connect(clickG).connect(dest);
      click.start(time);
      click.stop(time + 0.04);
      this.scheduledSources.push(click);

    } else if (type === 1) {
      // SNARE: Noise body + tonal ping + resonance
      const noiseDur = 0.18;
      const buf = ctx.createBuffer(1, ctx.sampleRate * noiseDur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.5);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 3500;
      bp.Q.value = 0.8;
      const noiseG = ctx.createGain();
      noiseG.gain.setValueAtTime(0.7, time);
      noiseG.gain.exponentialRampToValueAtTime(0.001, time + noiseDur);
      src.connect(bp).connect(noiseG).connect(dest);
      src.start(time);
      this.scheduledSources.push(src);

      // Tonal body
      const tone = ctx.createOscillator();
      const toneG = ctx.createGain();
      tone.type = 'triangle';
      tone.frequency.setValueAtTime(220, time);
      tone.frequency.exponentialRampToValueAtTime(120, time + 0.06);
      toneG.gain.setValueAtTime(0.5, time);
      toneG.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      tone.connect(toneG).connect(dest);
      tone.start(time);
      tone.stop(time + 0.15);
      this.scheduledSources.push(tone);

    } else if (type === 2) {
      // CLOSED HIHAT: Short filtered noise
      const dur = 0.06;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 8000;
      const peak = ctx.createBiquadFilter();
      peak.type = 'peaking';
      peak.frequency.value = 10000;
      peak.gain.value = 6;
      peak.Q.value = 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.35, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      src.connect(hp).connect(peak).connect(g).connect(dest);
      src.start(time);
      this.scheduledSources.push(src);

    } else {
      // OPEN HIHAT: Longer filtered noise with metallic ring
      const dur = 0.2;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.25, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      src.connect(hp).connect(g).connect(dest);
      src.start(time);
      this.scheduledSources.push(src);
    }
  }

  // ─── BASS: Fat analog-style with sub ───
  private scheduleBass(ctx: AudioContext, dest: GainNode, time: number, dur: number, pitch: number) {
    const freq = midiToFreq(pitch) / 2;
    const safeDur = Math.max(dur, 0.05);

    // Sub oscillator
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = freq;
    const subG = ctx.createGain();
    subG.gain.setValueAtTime(0.45, time);
    subG.gain.setValueAtTime(0.45, time + safeDur * 0.7);
    subG.gain.exponentialRampToValueAtTime(0.001, time + safeDur);
    sub.connect(subG).connect(dest);
    sub.start(time);
    sub.stop(time + safeDur);
    this.scheduledSources.push(sub);

    // Main saw oscillator with filter sweep
    const saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.value = freq;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200, time);
    lp.frequency.exponentialRampToValueAtTime(400, time + safeDur * 0.5);
    lp.Q.value = 4;
    const sawG = ctx.createGain();
    sawG.gain.setValueAtTime(0.3, time);
    sawG.gain.linearRampToValueAtTime(0.25, time + 0.02);
    sawG.gain.exponentialRampToValueAtTime(0.001, time + safeDur);
    saw.connect(lp).connect(sawG).connect(dest);
    saw.start(time);
    saw.stop(time + safeDur);
    this.scheduledSources.push(saw);

    // Square for grit
    const sq = ctx.createOscillator();
    sq.type = 'square';
    sq.frequency.value = freq;
    const sqLp = ctx.createBiquadFilter();
    sqLp.type = 'lowpass';
    sqLp.frequency.value = 600;
    const sqG = ctx.createGain();
    sqG.gain.setValueAtTime(0.12, time);
    sqG.gain.exponentialRampToValueAtTime(0.001, time + safeDur);
    sq.connect(sqLp).connect(sqG).connect(dest);
    sq.start(time);
    sq.stop(time + safeDur);
    this.scheduledSources.push(sq);
  }

  // ─── PIANO: Rich FM synthesis with hammer transient ───
  private schedulePiano(ctx: AudioContext, dest: GainNode, time: number, dur: number, pitch: number) {
    const freq = midiToFreq(pitch);
    const safeDur = Math.max(dur, 0.08);

    // Hammer transient (click)
    const click = ctx.createOscillator();
    const clickG = ctx.createGain();
    click.type = 'square';
    click.frequency.value = freq * 8;
    clickG.gain.setValueAtTime(0.06, time);
    clickG.gain.exponentialRampToValueAtTime(0.001, time + 0.008);
    click.connect(clickG).connect(dest);
    click.start(time);
    click.stop(time + 0.01);
    this.scheduledSources.push(click);

    // Harmonic series with realistic decay
    const harmonics = [
      { ratio: 1, amp: 0.28, decay: 1.0 },
      { ratio: 2, amp: 0.18, decay: 0.85 },
      { ratio: 3, amp: 0.10, decay: 0.7 },
      { ratio: 4, amp: 0.06, decay: 0.55 },
      { ratio: 5, amp: 0.03, decay: 0.4 },
      { ratio: 6, amp: 0.015, decay: 0.3 },
      { ratio: 7, amp: 0.008, decay: 0.25 },
    ];

    for (const h of harmonics) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * h.ratio;
      // Slight inharmonicity for realism (higher harmonics slightly sharp)
      if (h.ratio > 1) {
        osc.frequency.value *= 1 + (h.ratio * 0.0003);
      }
      const g = ctx.createGain();
      const decayTime = safeDur * h.decay;
      g.gain.setValueAtTime(h.amp, time);
      g.gain.setValueAtTime(h.amp * 0.85, time + 0.005); // fast initial drop
      g.gain.exponentialRampToValueAtTime(0.001, time + decayTime);
      osc.connect(g).connect(dest);
      osc.start(time);
      osc.stop(time + decayTime + 0.01);
      this.scheduledSources.push(osc);
    }
  }

  // ─── GUITAR: Karplus-Strong inspired pluck ───
  private scheduleGuitar(ctx: AudioContext, dest: GainNode, time: number, dur: number, pitch: number) {
    const freq = midiToFreq(pitch);
    const safeDur = Math.max(dur, 0.05);

    // Create pluck using noise burst filtered
    const burstDur = 0.005;
    const totalDur = Math.min(safeDur, 1.2);
    const bufLen = Math.ceil(ctx.sampleRate * (totalDur + burstDur));
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);

    // Initial noise burst
    const burstSamples = Math.ceil(ctx.sampleRate * burstDur);
    for (let i = 0; i < burstSamples; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.8;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    // Bandpass around fundamental
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 25; // Tight resonance for string-like tone

    // Another resonant filter for body
    const body = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = freq * 1.5;
    body.gain.value = 3;
    body.Q.value = 5;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, time);
    g.gain.exponentialRampToValueAtTime(0.3, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, time + totalDur);

    src.connect(bp).connect(body).connect(g).connect(dest);
    src.start(time);
    this.scheduledSources.push(src);

    // Add harmonic content with oscillators
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = freq;
    const osc1G = ctx.createGain();
    osc1G.gain.setValueAtTime(0.15, time);
    osc1G.gain.exponentialRampToValueAtTime(0.001, time + totalDur * 0.7);
    osc1.connect(osc1G).connect(dest);
    osc1.start(time);
    osc1.stop(time + totalDur);
    this.scheduledSources.push(osc1);

    // 2nd harmonic
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    const osc2G = ctx.createGain();
    osc2G.gain.setValueAtTime(0.06, time);
    osc2G.gain.exponentialRampToValueAtTime(0.001, time + totalDur * 0.4);
    osc2.connect(osc2G).connect(dest);
    osc2.start(time);
    osc2.stop(time + totalDur);
    this.scheduledSources.push(osc2);
  }

  // ─── STRINGS: Lush ensemble with vibrato ───
  private scheduleStrings(ctx: AudioContext, dest: GainNode, time: number, dur: number, pitch: number) {
    const freq = midiToFreq(pitch);
    const safeDur = Math.max(dur, 0.1);
    const attackTime = Math.min(0.4, safeDur * 0.25);
    const releaseTime = Math.min(0.3, safeDur * 0.15);

    // 6 detuned voices for ensemble richness
    const detunes = [-12, -6, -2, 2, 6, 12];
    const types: OscillatorType[] = ['sawtooth', 'sawtooth', 'triangle', 'triangle', 'sawtooth', 'sawtooth'];

    for (let i = 0; i < detunes.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = types[i];
      osc.frequency.value = freq;
      osc.detune.value = detunes[i];

      // Vibrato LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 4.5 + Math.random() * 1.5; // Slightly different per voice
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 3 + Math.random() * 2; // cents of vibrato
      lfo.connect(lfoGain).connect(osc.detune);
      lfo.start(time);
      lfo.stop(time + safeDur);
      this.scheduledSources.push(lfo);

      // Lowpass for warmth
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = freq * 3;
      lp.Q.value = 0.5;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, time);
      g.gain.linearRampToValueAtTime(0.055, time + attackTime);
      if (safeDur > attackTime + releaseTime) {
        g.gain.setValueAtTime(0.045, time + safeDur - releaseTime);
      }
      g.gain.exponentialRampToValueAtTime(0.001, time + safeDur);

      osc.connect(lp).connect(g).connect(dest);
      osc.start(time);
      osc.stop(time + safeDur);
      this.scheduledSources.push(osc);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    for (const src of this.scheduledSources) {
      try { src.stop(); } catch {}
    }
    this.scheduledSources = [];
    this.onStopCb?.();
  }

  setTrackVolume(track: TrackName, vol: number) {
    this.trackVolumes[track] = vol;
    if (this.trackGains[track]) {
      this.trackGains[track].gain.value = this.trackMuted[track] ? 0 : vol;
    }
  }

  setTrackMuted(track: TrackName, muted: boolean) {
    this.trackMuted[track] = muted;
    if (this.trackGains[track]) {
      this.trackGains[track].gain.value = muted ? 0 : this.trackVolumes[track];
    }
  }

  setMasterVolume(vol: number) {
    if (this.masterGain) this.masterGain.gain.value = vol;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const AudioEngine = new AudioEngineClass();
