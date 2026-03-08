import { useEffect, useRef } from 'react';
import { type PianoRollData, TRACK_NAMES, TRACK_COLORS, type TrackName } from '@/lib/dataGeneration';

interface Props {
  data: PianoRollData | null;
  currentStep?: number;
  height?: number;
  className?: string;
}

export default function PianoRollCanvas({ data, currentStep = -1, height = 300, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Grid
    const totalSteps = Math.max(...TRACK_NAMES.flatMap(t => data[t].map(n => n.step + n.len)), 128);
    const pitchMin = 24;
    const pitchMax = 84;
    const pitchRange = pitchMax - pitchMin;
    const stepW = w / totalSteps;
    const noteH = h / pitchRange;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= totalSteps; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i * stepW, 0);
      ctx.lineTo(i * stepW, h);
      ctx.stroke();
    }

    // Notes
    for (const track of TRACK_NAMES) {
      const color = TRACK_COLORS[track as TrackName];
      for (const note of data[track]) {
        const x = note.step * stepW;
        const y = h - ((note.pitch - pitchMin) / pitchRange) * h;
        const nw = note.len * stepW - 1;
        const nh = Math.max(noteH - 1, 2);
        ctx.fillStyle = color + 'cc';
        ctx.fillRect(x, y - nh, nw, nh);
        // Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        ctx.fillRect(x, y - nh, nw, nh);
        ctx.shadowBlur = 0;
      }
    }

    // Playhead
    if (currentStep >= 0) {
      const px = currentStep * stepW;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
      // Glow
      ctx.strokeStyle = 'rgba(79,143,255,0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
  }, [data, currentStep, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height }}
      className={`w-full rounded-lg border border-border ${className}`}
    />
  );
}
