import { useState, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import PianoRollCanvas from '@/components/PianoRollCanvas';
import WaveformCanvas from '@/components/WaveformCanvas';
import { generatePianoRollData, TRACK_NAMES, TRACK_COLORS, type PianoRollData, type TrackName } from '@/lib/dataGeneration';
import { AudioEngine } from '@/lib/audioEngine';

export default function MixerPage() {
  const [data, setData] = useState<PianoRollData>(() => generatePianoRollData(4, 55555));
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [volumes, setVolumes] = useState<Record<TrackName, number>>({ drums: 70, bass: 80, piano: 70, guitar: 60, strings: 50 });
  const [muted, setMuted] = useState<Record<TrackName, boolean>>({ drums: false, bass: false, piano: false, guitar: false, strings: false });
  const [solo, setSolo] = useState<TrackName | null>(null);
  const [masterVol, setMasterVol] = useState(75);
  const [reverb, setReverb] = useState(30);
  const [compression, setCompression] = useState(50);
  const [eqPreset, setEqPreset] = useState('flat');

  useEffect(() => {
    AudioEngine.setMasterVolume(masterVol / 100);
  }, [masterVol]);

  useEffect(() => {
    for (const t of TRACK_NAMES) {
      const isMuted = muted[t] || (solo !== null && solo !== t);
      AudioEngine.setTrackMuted(t, isMuted);
      AudioEngine.setTrackVolume(t, volumes[t] / 100);
    }
  }, [volumes, muted, solo]);

  const handlePlay = useCallback(() => {
    if (playing) { AudioEngine.stop(); setPlaying(false); return; }
    setPlaying(true);
    AudioEngine.play(data, 120,
      (step) => setCurrentStep(step),
      () => { setPlaying(false); setCurrentStep(-1); }
    );
  }, [data, playing]);

  const regenTrack = (track: TrackName) => {
    const newData = generatePianoRollData(4, Math.floor(Math.random() * 100000));
    setData(prev => ({ ...prev, [track]: newData[track] }));
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="container py-8">
        <p className="text-sm font-mono text-primary mb-2 tracking-widest uppercase">Audio Mixing Console</p>
        <h1 className="text-2xl md:text-4xl font-heading font-bold mb-8">Track Mixer</h1>

        {/* Play All */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={handlePlay} className="px-6 py-3 rounded-lg gradient-bg text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {playing ? 'Stop' : 'Play All'}
          </button>
        </div>

        {/* Track Strips */}
        <div className="space-y-3 mb-8">
          {TRACK_NAMES.map(t => {
            const isSoloed = solo === t;
            const isMutedFinal = muted[t] || (solo !== null && solo !== t);
            return (
              <div key={t} className={`p-4 rounded-xl bg-card border transition ${isMutedFinal ? 'border-border opacity-50' : 'border-border'} ${isSoloed ? 'ring-1 ring-primary' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: TRACK_COLORS[t] }} />
                    <span className="font-heading font-bold capitalize text-sm">{t}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMuted(p => ({ ...p, [t]: !p[t] }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition ${muted[t] ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                      MUTE
                    </button>
                    <button
                      onClick={() => setSolo(s => s === t ? null : t)}
                      className={`px-3 py-1 rounded text-xs font-bold transition ${isSoloed ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                      SOLO
                    </button>
                    <button onClick={() => regenTrack(t)} className="p-1.5 rounded bg-muted text-muted-foreground hover:text-foreground transition">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <WaveformCanvas isPlaying={playing && !isMutedFinal} color={TRACK_COLORS[t]} height={32} />
                  </div>

                  <div className="flex items-center gap-2 min-w-[140px]">
                    <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="range" min={0} max={100} value={volumes[t]}
                      onChange={e => setVolumes(p => ({ ...p, [t]: +e.target.value }))}
                      className="w-full accent-primary"
                    />
                    <span className="text-xs font-mono text-muted-foreground w-8 text-right">{volumes[t]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Master */}
        <div className="p-5 rounded-xl bg-card border border-border mb-8">
          <h3 className="font-heading font-bold mb-4">Master Section</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Master Volume: {masterVol}%</label>
              <input type="range" min={0} max={100} value={masterVol} onChange={e => setMasterVol(+e.target.value)} className="w-full accent-primary" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Reverb: {reverb}%</label>
              <input type="range" min={0} max={100} value={reverb} onChange={e => setReverb(+e.target.value)} className="w-full accent-secondary" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Compression: {compression}%</label>
              <input type="range" min={0} max={100} value={compression} onChange={e => setCompression(+e.target.value)} className="w-full accent-accent" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">EQ Preset</label>
              <select value={eqPreset} onChange={e => setEqPreset(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground">
                {['flat', 'bass boost', 'vocal', 'bright', 'warm'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Piano Roll */}
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-heading font-bold mb-3">Full Piano Roll</h3>
          <PianoRollCanvas data={data} currentStep={currentStep} height={250} />
        </div>
      </div>

      <footer className="py-8 border-t border-border mt-12">
        <div className="container text-center text-sm text-muted-foreground">© 2026 MusicGAN Research</div>
      </footer>
    </div>
  );
}
