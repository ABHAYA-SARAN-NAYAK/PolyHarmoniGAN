import { type PianoRollData, type TrackName, TRACK_NAMES } from './dataGeneration';

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class AudioEngineClass {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackGains: Record<TrackName, GainNode> = {} as any;
  private trackMuted: Record<TrackName, boolean> = { drums: false, bass: false, piano: false, guitar: false, strings: false };
  private trackVolumes: Record<TrackName, number> = { drums: 0.7, bass: 0.8, piano: 0.7, guitar: 0.6, strings: 0.5 };
  private isPlaying = false;
  private rafId: number | null = null;
  private startTime = 0;
  private totalDuration = 0;
  private onStepCb: ((step: number, progress: number) => void) | null = null;
  private onStopCb: (() => void) | null = null;
  private scheduledSources: (AudioBufferSourceNode | OscillatorNode)[] = [];

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);
      for (const t of TRACK_NAMES) {
        this.trackGains[t] = this.ctx.createGain();
        this.trackGains[t].gain.value = this.trackMuted[t] ? 0 : this.trackVolumes[t];
        this.trackGains[t].connect(this.masterGain);
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  play(noteData: PianoRollData, bpm: number, onStep?: (step: number, progress: number) => void, onStop?: () => void) {
    this.stop();
    const ctx = this.getCtx();
    // Refresh track gains
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

    // Schedule all notes
    this.scheduleTrack(ctx, noteData.drums, 'drums', stepDuration);
    this.scheduleTrack(ctx, noteData.bass, 'bass', stepDuration);
    this.scheduleTrack(ctx, noteData.piano, 'piano', stepDuration);
    this.scheduleTrack(ctx, noteData.guitar, 'guitar', stepDuration);
    this.scheduleTrack(ctx, noteData.strings, 'strings', stepDuration);

    // Animation loop
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
        case 'drums':
          this.scheduleDrum(ctx, gain, noteTime, note.pitch);
          break;
        case 'bass':
          this.scheduleBass(ctx, gain, noteTime, noteDur, note.pitch);
          break;
        case 'piano':
          this.schedulePiano(ctx, gain, noteTime, noteDur, note.pitch);
          break;
        case 'guitar':
          this.scheduleGuitar(ctx, gain, noteTime, noteDur, note.pitch);
          break;
        case 'strings':
          this.scheduleStrings(ctx, gain, noteTime, noteDur, note.pitch);
          break;
      }
    }
  }

  private scheduleDrum(ctx: AudioContext, dest: GainNode, time: number, pitch: number) {
    const type = pitch % 3;
    if (type === 0) {
      // Kick
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.08);
      g.gain.setValueAtTime(0.8, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
      osc.connect(g).connect(dest);
      osc.start(time);
      osc.stop(time + 0.25);
      this.scheduledSources.push(osc);
    } else if (type === 1) {
      // Snare
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.6, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      src.connect(hp).connect(g).connect(dest);
      src.start(time);
      this.scheduledSources.push(src);
    } else {
      // Hihat
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      src.connect(hp).connect(g).connect(dest);
      src.start(time);
      this.scheduledSources.push(src);
    }
  }

  private scheduleBass(ctx: AudioContext, dest: GainNode, time: number, dur: number, pitch: number) {
    const freq = midiToFreq(pitch) / 2;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc1.connect(lp);
    osc2.connect(lp);
    lp.connect(g).connect(dest);
    osc1.start(time);
    osc1.stop(time + dur);
    osc2.start(time);
    osc2.stop(time + dur);
    this.scheduledSources.push(osc1, osc2);
  }

  private schedulePiano(ctx: AudioContext, dest: GainNode, time: number, dur: number, pitch: number) {
    const freq = midiToFreq(pitch);
    const amps = [1, 0.5, 0.25, 0.12, 0.06];
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * (i + 1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.15 * amps[i], time);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(g).connect(dest);
      osc.start(time);
      osc.stop(time + dur);
      this.scheduledSources.push(osc);
    }
  }

  private scheduleGuitar(ctx: AudioContext, dest: GainNode, time: number, dur: number, pitch: number) {
    const freq = midiToFreq(pitch);
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq * 2;
    bp.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + Math.min(dur, 0.3));
    osc1.connect(bp);
    osc2.connect(bp);
    bp.connect(g).connect(dest);
    osc1.start(time);
    osc1.stop(time + dur);
    osc2.start(time);
    osc2.stop(time + dur);
    this.scheduledSources.push(osc1, osc2);
  }

  private scheduleStrings(ctx: AudioContext, dest: GainNode, time: number, dur: number, pitch: number) {
    const freq = midiToFreq(pitch);
    const detunes = [-8, -4, 0, 4, 8];
    for (const d of detunes) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = d;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, time);
      g.gain.linearRampToValueAtTime(0.08, time + Math.min(0.3, dur * 0.3));
      g.gain.linearRampToValueAtTime(0.06, time + dur * 0.8);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(g).connect(dest);
      osc.start(time);
      osc.stop(time + dur);
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
