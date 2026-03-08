import { useState, useCallback } from 'react';
import { Upload, Lock, Unlock, Play, Pause } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import PianoRollCanvas from '@/components/PianoRollCanvas';
import MetricBar from '@/components/MetricBar';
import { generatePianoRollData, TRACK_NAMES, type PianoRollData, type TrackName } from '@/lib/dataGeneration';
import { AudioEngine } from '@/lib/audioEngine';

export default function CollaboratePage() {
  const [uploaded, setUploaded] = useState(false);
  const [locks, setLocks] = useState<Record<TrackName, boolean>>({ drums: false, bass: false, piano: true, guitar: false, strings: false });
  const [creativity, setCreativity] = useState(70);
  const [harmonic, setHarmonic] = useState(80);
  const [rhythm, setRhythm] = useState(75);
  const [style, setStyle] = useState('jazz');
  const [data, setData] = useState<PianoRollData | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const contributions = TRACK_NAMES.map(t => ({
    track: t,
    human: locks[t] ? 100 : Math.floor(15 + Math.random() * 25),
    ai: locks[t] ? 0 : Math.floor(60 + Math.random() * 25),
  }));

  const handleGenerate = useCallback(() => {
    const result = generatePianoRollData(4, 99887 + creativity + harmonic);
    setData(result);
  }, [creativity, harmonic]);

  const handlePlay = useCallback(() => {
    if (!data) return;
    if (playing) { AudioEngine.stop(); setPlaying(false); return; }
    setPlaying(true);
    AudioEngine.play(data, 120,
      (step) => setCurrentStep(step),
      () => { setPlaying(false); setCurrentStep(-1); }
    );
  }, [data, playing]);

  return (
    <div className="min-h-screen pt-16">
      <div className="container py-8">
        <ScrollReveal>
          <p className="text-sm font-mono text-primary mb-2 tracking-widest uppercase">Co-Creation Mode</p>
          <h1 className="text-2xl md:text-4xl font-heading font-bold mb-4">Human-AI Collaboration</h1>
          <p className="text-muted-foreground max-w-xl mb-8">Upload your MIDI, lock tracks you want to keep, and let AI fill in the rest.</p>
        </ScrollReveal>

        {/* 4-step workflow */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {['Upload MIDI', 'Lock Tracks', 'Set Parameters', 'Generate'].map((s, i) => (
            <div key={s} className={`p-3 rounded-lg border text-center text-sm ${i === 0 && !uploaded ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
              <span className="font-heading font-bold">Step {i + 1}</span>
              <p>{s}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          {/* Left */}
          <div className="space-y-4">
            {/* Upload */}
            <div
              onClick={() => setUploaded(true)}
              className={`p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition ${uploaded ? 'border-accent bg-accent/5' : 'border-border hover:border-primary/40'}`}
            >
              <Upload className={`w-8 h-8 mx-auto mb-2 ${uploaded ? 'text-accent' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">{uploaded ? 'sample_track.mid uploaded' : 'Drop MIDI file here'}</p>
              <p className="text-xs text-muted-foreground mt-1">{uploaded ? '5 tracks detected' : 'or click to browse'}</p>
            </div>

            {/* Track Locks */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <h3 className="text-sm font-heading font-bold">Track Locks</h3>
              {TRACK_NAMES.map(t => (
                <div key={t} className="flex items-center justify-between">
                  <span className="text-sm capitalize flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(var(--track-${t}))` }} />
                    {t}
                  </span>
                  <button
                    onClick={() => setLocks(p => ({ ...p, [t]: !p[t] }))}
                    className={`p-1.5 rounded-md transition ${locks[t] ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                  >
                    {locks[t] ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>

            {/* Sliders */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Creativity: {creativity}%</label>
                <input type="range" min={0} max={100} value={creativity} onChange={e => setCreativity(+e.target.value)} className="w-full accent-primary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Harmonic Weight: {harmonic}%</label>
                <input type="range" min={0} max={100} value={harmonic} onChange={e => setHarmonic(+e.target.value)} className="w-full accent-primary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Rhythm Weight: {rhythm}%</label>
                <input type="range" min={0} max={100} value={rhythm} onChange={e => setRhythm(+e.target.value)} className="w-full accent-primary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Style</label>
                <select value={style} onChange={e => setStyle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground">
                  {['jazz', 'classical', 'electronic', 'rock', 'ambient'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={handleGenerate} className="w-full py-3 rounded-lg gradient-bg font-semibold text-primary-foreground hover:opacity-90 transition">
                Generate Collaboration
              </button>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-heading font-bold">Generated Output</h3>
                <button onClick={handlePlay} disabled={!data} className="px-4 py-2 rounded-lg gradient-bg text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-30">
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {playing ? 'Stop' : 'Play'}
                </button>
              </div>
              <PianoRollCanvas data={data} currentStep={currentStep} height={300} />
            </div>

            {/* Contribution Analysis */}
            {data && (
              <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                <h3 className="text-sm font-heading font-bold">Contribution Analysis</h3>
                {contributions.map(c => (
                  <div key={c.track} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{c.track}</span>
                      <span>Human {c.human}% / AI {c.ai}%</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary" style={{ width: `${c.human}%` }} />
                      <div className="gradient-bg" style={{ width: `${c.ai}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Research Notes */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-heading font-bold mb-2">Research Notes</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>The collaboration system uses a conditional GAN that takes existing MIDI tracks as input constraints. Locked tracks are preserved exactly, while unlocked tracks are regenerated to complement the existing material.</p>
                <p>The creativity slider controls the temperature parameter of the latent space sampling, while harmonic and rhythm weights adjust the loss function balance during inference-time optimization.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-8 border-t border-border mt-12">
        <div className="container text-center text-sm text-muted-foreground">© 2026 MusicGAN Research</div>
      </footer>
    </div>
  );
}
