import { Link } from 'react-router-dom';
import { Brain, Music, Sliders, BarChart3, Users, Layers, Play, Cpu, Database, Zap, Clock } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

const STATS = [
{ icon: Brain, value: '3', label: 'GAN Models' },
{ icon: Music, value: '5', label: 'Instruments' },
{ icon: Zap, value: '100%', label: 'AI Generated' },
{ icon: Clock, value: '<2s', label: 'Generation Time' }];


const FEATURES = [
{ icon: Brain, title: 'Model Selection', desc: 'Choose from 3 GAN architectures optimized for different music styles', to: '/models' },
{ icon: Music, title: 'Music Generation', desc: 'Generate multi-track polyphonic music with real-time audio playback', to: '/generate' },
{ icon: Users, title: 'Human-AI Collab', desc: 'Upload your MIDI and let AI complete or enhance your composition', to: '/collaborate' },
{ icon: Sliders, title: 'Track Mixer', desc: 'Mix, mute, solo and adjust individual instrument tracks', to: '/mixer' },
{ icon: BarChart3, title: 'Evaluation', desc: 'Analyze quality metrics across all models with visual comparisons', to: '/evaluation' },
{ icon: Layers, title: 'Architecture', desc: 'Explore the GAN architecture and data pipeline in detail', to: '#architecture' }];


const SPECS = [
{ label: 'Input Tensor', value: '128×84×5' },
{ label: 'Latent Space', value: '256-dim' },
{ label: 'Dataset', value: '10K+ Songs' },
{ label: 'Generation', value: '<2 sec' }];


export default function HomePage() {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(217_100%_66%/0.08),transparent_70%)]" />
        <div className="container relative text-center">
          <ScrollReveal>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6">
              <span className="gradient-text">MusicGAN</span> Research
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Advanced Multi-Track Polyphonic Music Generation Using Generative Adversarial Networks
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/generate" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-bg font-semibold text-primary-foreground hover:opacity-90 transition glow-primary">
                <Play className="w-4 h-4" /> Try Live Demo
              </Link>
              <Link to="/models" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border font-semibold text-foreground hover:bg-muted transition">
                Explore Models
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) =>
          <ScrollReveal key={s.label} delay={i * 0.1}>
              <div className="text-center">
                <s.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-heading font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Abstract */}
      <section className="py-20">
        <div className="container max-w-3xl">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-6">Research Abstract</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                This research presents MusicGAN, a novel framework for generating multi-track polyphonic music
                using Generative Adversarial Networks. Our approach leverages three distinct GAN architectures —
                Conv+LSTM, Transformer-based, and a hybrid Conv+Transformer model — to synthesize musically
                coherent compositions across five instrument tracks simultaneously.
              </p>
              <p>
                The system processes a 128×84×5 tensor representation of musical data, encoding temporal steps,
                pitch range, and instrument channels. Through adversarial training on a dataset of 10,000+ songs,
                our models learn to capture complex harmonic relationships, rhythmic patterns, and multi-instrument
                coordination, achieving generation times under 2 seconds.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card/50">
        <div className="container">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-12 text-center">Research Features</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) =>
            <ScrollReveal key={f.title} delay={i * 0.08}>
                <Link to={f.to} className="block p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition group">
                  <f.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-heading font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </Link>
              </ScrollReveal>
            )}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="py-20">
        <div className="container">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-12 text-center">System Architecture</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8">
            <ScrollReveal delay={0.1}>
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="font-heading font-bold mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-accent" /> Data Pipeline</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {['MIDI Collection → 10K+ songs', 'Pre-processing → Note extraction', 'Tensor Encoding → 128×84×5', 'Data Augmentation → Transposition, tempo', 'Train/Val Split → 80/20'].map((s) =>
                  <div key={s} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      {s}
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="font-heading font-bold mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-primary" /> GAN Architecture</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {['Latent Vector z ∈ ℝ²⁵⁶', 'Generator: Upsampling + Conv blocks', 'Discriminator: Conv + Spectral Norm', 'Multi-track conditioning layer', 'Wasserstein loss + gradient penalty'].map((s) =>
                  <div key={s} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {s}
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-16 border-y border-border">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8">
          {SPECS.map((s, i) =>
          <ScrollReveal key={s.label} delay={i * 0.1}>
              <div className="text-center">
                <p className="text-xl md:text-2xl font-heading font-bold text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Research Highlights */}
      <section className="py-20">
        <div className="container max-w-3xl">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8">Research Highlights</h2>
            <div className="space-y-4">
              {[
              'First framework to generate 5-track polyphonic music with GANs in real-time',
              'Hybrid Conv+Transformer architecture achieves 89% quality score',
              'Novel multi-track conditioning mechanism ensures harmonic coherence',
              'Human evaluation shows 73% preference over existing models'].
              map((h, i) =>
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">{i + 1}</span>
                  <p className="text-sm text-muted-foreground">{h}</p>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <ScrollReveal>
            <div className="text-center p-12 rounded-2xl bg-card border border-border relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(217_100%_66%/0.06),transparent_70%)]" />
              <div className="relative">
                <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">Ready to Generate Music?</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">Experience AI music generation in your browser. No downloads required.</p>
                <Link to="/generate" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg gradient-bg font-semibold text-primary-foreground hover:opacity-90 transition glow-primary">
                  <Play className="w-4 h-4" /> Launch Generator
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container text-center text-sm text-muted-foreground">© 2026 MusicGAN Research — Made By Varsha

        </div>
      </footer>
    </div>);

}