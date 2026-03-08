import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import MetricBar from '@/components/MetricBar';

const MODELS = [
  {
    id: 'jamming',
    name: 'Jamming Model',
    arch: 'Conv + LSTM',
    desc: 'Excels at creating diverse, improvisational music with high variety scores.',
    metrics: { harmonic: 72, rhythm: 88, variety: 91, quality: 76 },
    recommended: false,
  },
  {
    id: 'composer',
    name: 'Composer Model',
    arch: 'Transformer',
    desc: 'Produces highly structured, compositionally coherent pieces with strong harmonic quality.',
    metrics: { harmonic: 85, rhythm: 79, variety: 70, quality: 83 },
    recommended: false,
  },
  {
    id: 'hybrid',
    name: 'Hybrid Model',
    arch: 'Conv + Transformer',
    desc: 'Best of both worlds — top scores across all metrics. Our recommended model.',
    metrics: { harmonic: 91, rhythm: 93, variety: 85, quality: 89 },
    recommended: true,
  },
];

export default function ModelsPage() {
  return (
    <div className="min-h-screen pt-16">
      <section className="py-20">
        <div className="container">
          <ScrollReveal>
            <p className="text-sm font-mono text-primary mb-2 tracking-widest uppercase">Architecture Comparison</p>
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">GAN Models</h1>
            <p className="text-muted-foreground max-w-xl mb-12">Select a model architecture to use for music generation. Each model has unique strengths.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {MODELS.map((m, i) => (
              <ScrollReveal key={m.id} delay={i * 0.1}>
                <div className={`relative p-6 rounded-xl bg-card border transition hover:border-primary/40 ${m.recommended ? 'border-primary glow-primary' : 'border-border'}`}>
                  {m.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-bg text-xs font-bold text-primary-foreground flex items-center gap-1">
                      <Star className="w-3 h-3" /> Recommended
                    </div>
                  )}
                  <h3 className="font-heading font-bold text-lg mb-1">{m.name}</h3>
                  <p className="text-xs text-primary font-mono mb-3">{m.arch}</p>
                  <p className="text-sm text-muted-foreground mb-6">{m.desc}</p>
                  <div className="space-y-3 mb-6">
                    <MetricBar label="Harmonic" value={m.metrics.harmonic} />
                    <MetricBar label="Rhythm" value={m.metrics.rhythm} />
                    <MetricBar label="Variety" value={m.metrics.variety} />
                    <MetricBar label="Quality" value={m.metrics.quality} />
                  </div>
                  <Link
                    to={`/generate?model=${m.id}`}
                    className={`block text-center px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                      m.recommended ? 'gradient-bg text-primary-foreground' : 'border border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    Select Model
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Comparison Table */}
          <ScrollReveal>
            <h2 className="text-xl font-heading font-bold mb-6">Full Comparison</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-heading">Metric</th>
                    {MODELS.map(m => <th key={m.id} className="text-center p-4 font-heading">{m.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(['Architecture', 'Harmonic', 'Rhythm', 'Variety', 'Quality'] as const).map(metric => (
                    <tr key={metric} className="border-b border-border/50">
                      <td className="p-4 text-muted-foreground">{metric}</td>
                      {MODELS.map(m => (
                        <td key={m.id} className="text-center p-4 font-mono">
                          {metric === 'Architecture' ? m.arch : `${m.metrics[metric.toLowerCase() as keyof typeof m.metrics]}%`}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <footer className="py-8 border-t border-border">
        <div className="container text-center text-sm text-muted-foreground">© 2026 MusicGAN Research</div>
      </footer>
    </div>
  );
}
