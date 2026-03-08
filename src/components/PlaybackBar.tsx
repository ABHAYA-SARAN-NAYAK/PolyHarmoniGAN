import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface Props {
  isVisible: boolean;
  isPlaying: boolean;
  trackName: string;
  modelName: string;
  progress: number;
  currentTime: string;
  totalTime: string;
  onPlay: () => void;
  onStop: () => void;
}

export default function PlaybackBar({ isVisible, isPlaying, trackName, modelName, progress, currentTime, totalTime, onPlay, onStop }: Props) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border animate-slide-up">
      <div className="container flex items-center gap-4 h-16">
        <div className="flex-shrink-0 min-w-0">
          <p className="text-sm font-medium truncate">{trackName}</p>
          <p className="text-xs text-muted-foreground truncate">{modelName}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="p-1.5 text-muted-foreground hover:text-foreground"><SkipBack className="w-4 h-4" /></button>
          <button onClick={isPlaying ? onStop : onPlay} className="p-2 rounded-full gradient-bg text-primary-foreground">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground"><SkipForward className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{currentTime}</span>
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{totalTime}</span>
        </div>

        {/* Mini waveform bars */}
        <div className="hidden sm:flex items-end gap-0.5 h-8">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 gradient-bg rounded-full transition-all"
              style={{
                height: isPlaying ? `${20 + Math.sin(Date.now() / 200 + i) * 60}%` : '20%',
                opacity: isPlaying ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
