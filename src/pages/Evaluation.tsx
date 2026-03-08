import { useState, useCallback } from 'react';
import { Play, BarChart3 } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import MetricBar from '@/components/MetricBar';
import PianoRollCanvas from '@/components/PianoRollCanvas';
import { generatePianoRollData, MODEL_METRICS } from '@/lib/dataGeneration';

const MODELS = ['jamming', 'composer', 'hybrid'] as const;
const METRICS = ['harmonic', 'rhythm', 'variety', 'quality'] as const;
const METRIC_LABELS: Record<string, string> = { harmonic: 'Harmonic Score', rhythm: 'Rhythm Alignment', variety: 'Variety', quality: 'Overall Quality' };

export default function EvaluationPage() {
  const [scores, setScores] = useState(MODEL_METRICS);
  const [animating, setAnimating] = useState(false);
  const [evalHistory, setEvalHistory] = useState<{ time: string; model: string; quality: number }[]>([
    { time: '14:32', model: 'hybrid', quality: 89 },
    { time: '14:28', model: 'composer', quality: 83 },
    { time: '14:25', model: 'jamming', quality: 76 },
  ]);

  const runEvaluation = useCallback(async () => {
    setAnimating(true);
    // Animate scores counting up
    const target = { ...MODEL_METRICS };
    const zero: typeof target = {
      jamming: { harmonic: 0, rhythm: 0, variety: 0, quality: 0 },
      composer: { harmonic: 0, rhythm: 0, variety: 0, quality: 0 },
      hybrid: { harmonic: 0, rhythm: 0, variety: 0, quality: 0 },
    };
    setScores(zero);
    const steps = 30;
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, 40));
      const frac = i / steps;
      setScores({
        jamming: { harmonic: Math.round(target.jamming.harmonic * frac), rhythm: Math.round(target.jamming.rhythm * frac), variety: Math.round(target.jamming.variety * frac), quality: Math.round(target.jamming.quality * frac) },
        composer: { harmonic: Math.round(target.composer.harmonic * frac), rhythm: Math.round(target.composer.rhythm * frac), variety: Math.round(target.composer.variety * frac), quality: Math.round(target.composer.quality * frac) },
        hybrid: { harmonic: Math.round(target.hybrid.harmonic * frac), rhythm: Math.round(target.hybrid.rhythm * frac), variety: Math.round(target.hybrid.variety * frac), quality: Math.round(target.hybrid.quality * frac) },
      });
    }
    setEvalHistory(prev => [{ time: new Date().toLocaleTimeString().slice(0, 5), model: 'all', quality: 89 }, ...prev]);
    setAnimating(false);
  }, []);

  const summaryCards = [
    { label: 'Overall Quality', value: scores.hybrid.quality, color: 'hsl(var(--primary))' },
    { label: 'Harmonic Score', value: scores.hybrid.harmonic, color: 'hsl(var(--secondary))' },
    { label: 'Rhythm Alignment', value: scores.hybrid.rhythm, color: 'hsl(var(--accent))' },
    { label: 'Note Density', value: 85, color: 'hsl(var(--track-strings))' },
  ];

  return (
    <div className="min-h-screen pt-16">
      <div className="container py-8">
        <ScrollReveal>
          <p className="text-sm font-mono text-primary mb-2 tracking-widest uppercase">Performance Analysis</p>
          <h1 className="text-2xl md:text-4xl font-heading font-bold mb-4">Evaluation Dashboard</h1>
          <p className="text-muted-foreground max-w-xl mb-8">Compare model performance across quality metrics.</p>
        </ScrollReveal>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {summaryCards.map((c, i) => (
            <ScrollReveal key={c.label} delay={i * 0.08}>
              <div className="p-5 rounded-xl bg-card border border-border text-center">
                <p className="text-3xl font-heading font-bold" style={{ color: c.color }}>{c.value}%</p>
                <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Run Evaluation */}
        <div className="flex mb-8">
          <button onClick={runEvaluation} disabled={animating} className="px-6 py-3 rounded-lg gradient-bg text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50">
            <Play className="w-4 h-4" /> {animating ? 'Running...' : 'Run Evaluation'}
          </button>
        </div>

        {/* Model Comparison Bars */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {MODELS.map(m => (
            <div key={m} className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-heading font-bold capitalize mb-4">{m} Model</h3>
              <div className="space-y-3">
                {METRICS.map(metric => (
                  <MetricBar key={metric} label={METRIC_LABELS[metric]} value={scores[m][metric]} animated={false} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Radar-like comparison (simple table visual) */}
        <ScrollReveal>
          <div className="p-5 rounded-xl bg-card border border-border mb-10">
            <h3 className="font-heading font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Model Comparison Radar</h3>
            <div className="grid grid-cols-1 gap-4">
              {METRICS.map(metric => (
                <div key={metric}>
                  <p className="text-sm text-muted-foreground mb-2">{METRIC_LABELS[metric]}</p>
                  <div className="flex gap-2">
                    {MODELS.map(m => (
                      <div key={m} className="flex-1">
                        <div className="h-6 bg-muted rounded-full overflow-hidden relative">
                          <div className="h-full rounded-full gradient-bg transition-all duration-700" style={{ width: `${scores[m][metric]}%` }} />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold">{scores[m][metric]}%</span>
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-1 capitalize">{m}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Mini Piano Rolls */}
        <ScrollReveal>
          <h3 className="font-heading font-bold mb-4">Per-Model Preview</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {MODELS.map(m => (
              <div key={m} className="rounded-xl bg-card border border-border p-3">
                <p className="text-sm font-heading font-bold capitalize mb-2">{m}</p>
                <PianoRollCanvas data={generatePianoRollData(2, m === 'jamming' ? 12345 : m === 'composer' ? 67890 : 24680)} height={120} />
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Evaluation History */}
        <ScrollReveal>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-heading">Time</th>
                  <th className="text-left p-4 font-heading">Model</th>
                  <th className="text-left p-4 font-heading">Quality</th>
                </tr>
              </thead>
              <tbody>
                {evalHistory.map((e, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-4 text-muted-foreground font-mono">{e.time}</td>
                    <td className="p-4 capitalize">{e.model}</td>
                    <td className="p-4 font-mono text-primary">{e.quality}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </div>

      <footer className="py-8 border-t border-border mt-12">
        <div className="container text-center text-sm text-muted-foreground">© 2026 MusicGAN Research</div>
      </footer>
    </div>
  );
}
