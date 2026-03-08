import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Pause, Download, Sparkles } from 'lucide-react';
import PianoRollCanvas from '@/components/PianoRollCanvas';
import WaveformCanvas from '@/components/WaveformCanvas';
import MetricBar from '@/components/MetricBar';
import { generatePianoRollData, getModelSeed, MODEL_METRICS, GENERATION_LOGS, TRACK_NAMES, type PianoRollData } from '@/lib/dataGeneration';
import { AudioEngine } from '@/lib/audioEngine';

export default function GeneratePage() {
  const [searchParams] = useSearchParams();
  const [model, setModel] = useState(searchParams.get('model') || 'hybrid');
  const [bpm, setBpm] = useState(120);
  const [density, setDensity] = useState(50);
  const [key, setKey] = useState('C Major');
  const [timeSig, setTimeSig] = useState('4/4');
  const [bars, setBars] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [data, setData] = useState<PianoRollData | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const m = searchParams.get('model');
    if (m && ['jamming', 'composer', 'hybrid'].includes(m)) setModel(m);
  }, [searchParams]);

  const handleGenerate = useCallback(async () => {
    AudioEngine.stop();
    setPlaying(false);
    setGenerating(true);
    setLogs([]);
    setData(null);
    setCurrentStep(-1);
    setProgress(0);

    for (let i = 0; i < GENERATION_LOGS.length; i++) {
      await new Promise(r => setTimeout(r, 150 + Math.random() * 100));
      setLogs(prev => [...prev, GENERATION_LOGS[i]]);
    }

    const seed = getModelSeed(model) + bpm + density;
    const result = generatePianoRollData(bars, seed);
    setData(result);
    setGenerating(false);
  }, [model, bpm, density, bars]);

  const handlePlay = useCallback(() => {
    if (!data) return;
    if (playing) {
      AudioEngine.stop();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    AudioEngine.play(data, bpm,
      (step, prog) => { setCurrentStep(step); setProgress(prog); },
      () => { setPlaying(false); setCurrentStep(-1); setProgress(0); }
    );
  }, [data, playing, bpm]);

  const metrics = MODEL_METRICS[model] || MODEL_METRICS.hybrid;

  return (
    <div className="min-h-screen pt-16">
      <div className="container py-8">
        <p className="text-sm font-mono text-primary mb-2 tracking-widest uppercase">AI Composition Engine</p>
        <h1 className="text-2xl md:text-4xl font-heading font-bold mb-8">Music Generation</h1>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          {/* Left: Controls */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-card border border-border space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">GAN Model</label>
                <select value={model} onChange={e => setModel(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground">
                  <option value="jamming">Jamming (Conv+LSTM)</option>
                  <option value="composer">Composer (Transformer)</option>
                  <option value="hybrid">Hybrid (Conv+Transformer)</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Tempo: {bpm} BPM</label>
                <input type="range" min={60} max={200} value={bpm} onChange={e => setBpm(+e.target.value)} className="w-full accent-primary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Note Density: {density}%</label>
                <input type="range" min={10} max={100} value={density} onChange={e => setDensity(+e.target.value)} className="w-full accent-primary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Key Signature</label>
                <select value={key} onChange={e => setKey(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground">
                  {['C Major', 'G Major', 'D Major', 'A Minor', 'E Minor', 'D Minor'].map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Time Signature</label>
                <select value={timeSig} onChange={e => setTimeSig(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground">
                  {['4/4', '3/4', '6/8'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Bars</label>
                <select value={bars} onChange={e => setBars(+e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground">
                  {[2, 4, 8, 16].map(b => <option key={b} value={b}>{b} bars</option>)}
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 rounded-lg gradient-bg font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate Music'}
              </button>
            </div>

            {/* Logs */}
            {logs.length > 0 && (
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-heading font-bold mb-2">Generation Log</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
                  {logs.map((l, i) => (
                    <div key={i} className={`flex items-center gap-2 ${i === logs.length - 1 && generating ? 'text-primary' : 'text-muted-foreground'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === logs.length - 1 && generating ? 'bg-primary animate-pulse-glow' : 'bg-accent'}`} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics */}
            {data && (
              <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                <h3 className="text-sm font-heading font-bold">Quality Metrics</h3>
                <MetricBar label="Note Density" value={density} />
                <MetricBar label="Harmonic Consistency" value={metrics.harmonic} />
                <MetricBar label="Rhythm Alignment" value={metrics.rhythm} />
                <MetricBar label="Quality Score" value={metrics.quality} />
              </div>
            )}
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            {/* Status */}
            <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${data ? 'bg-accent' : generating ? 'bg-primary animate-pulse-glow' : 'bg-muted-foreground'}`} />
                <span className="text-sm">{generating ? 'Generating...' : data ? 'Ready to play' : 'Awaiting generation'}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePlay}
                  disabled={!data}
                  className="px-4 py-2 rounded-lg gradient-bg text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-30 hover:opacity-90 transition"
                >
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {playing ? 'Pause' : 'Play'}
                </button>
                <button disabled={!data} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold flex items-center gap-2 disabled:opacity-30 hover:bg-muted transition">
                  <Download className="w-4 h-4" /> Export MIDI
                </button>
              </div>
            </div>

            {/* Piano Roll */}
            <div className="rounded-xl bg-card border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-heading font-bold">Multi-Track Piano Roll</h3>
                <div className="flex gap-2 ml-auto">
                  {TRACK_NAMES.map(t => (
                    <span key={t} className="text-xs flex items-center gap-1 text-muted-foreground">
                      <span className={`w-2 h-2 rounded-full bg-track-${t}`} style={{ backgroundColor: `hsl(var(--track-${t}))` }} />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <PianoRollCanvas data={data} currentStep={currentStep} height={280} />
            </div>

            {/* Waveforms */}
            <div className="rounded-xl bg-card border border-border p-3">
              <h3 className="text-sm font-heading font-bold mb-2">Track Waveforms</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {TRACK_NAMES.map(t => (
                  <div key={t}>
                    <p className="text-xs text-muted-foreground mb-1 capitalize">{t}</p>
                    <WaveformCanvas isPlaying={playing} color={`hsl(var(--track-${t}))`} height={40} />
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            {data && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <span>{formatTime(progress * bars * (60 / bpm) * 4)}</span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
                <span>{formatTime(bars * (60 / bpm) * 4)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="py-8 border-t border-border mt-12">
        <div className="container text-center text-sm text-muted-foreground">© 2026 MusicGAN Research</div>
      </footer>
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
