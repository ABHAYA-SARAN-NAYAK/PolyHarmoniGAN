import { useEffect, useRef } from 'react';

interface Props {
  isPlaying?: boolean;
  color?: string;
  height?: number;
  className?: string;
}

export default function WaveformCanvas({ isPlaying = false, color = '#4f8fff', height = 60, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    let phase = 0;
    const draw = () => {
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const amp = isPlaying ? (0.3 + Math.sin(x * 0.02 + phase) * 0.2 + Math.sin(x * 0.05 + phase * 1.3) * 0.15) : 0.05;
        const y = h / 2 + Math.sin(x * 0.03 + phase) * amp * h;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      phase += isPlaying ? 0.08 : 0.01;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, color, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height }}
      className={`w-full rounded-md border border-border ${className}`}
    />
  );
}
