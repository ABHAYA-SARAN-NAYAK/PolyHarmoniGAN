interface Props {
  label: string;
  value: number;
  color?: string;
  animated?: boolean;
}

export default function MetricBar({ label, value, color, animated = true }: Props) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-bold">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${animated ? 'transition-all duration-1000' : ''}`}
          style={{
            width: `${value}%`,
            background: color || 'var(--gradient-primary)',
          }}
        />
      </div>
    </div>
  );
}
