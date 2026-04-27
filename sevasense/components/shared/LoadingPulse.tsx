interface LoadingPulseProps {
  lines?: number;
  className?: string;
}

export default function LoadingPulse({ lines = 3, className = '' }: LoadingPulseProps) {
  // Use deterministic widths based on index to prevent hydration mismatch
  const getDeterministicWidth = (i: number) => {
    const widths = [75, 60, 85, 65, 80];
    return `${widths[i % widths.length]}%`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-elevated animate-shimmer"
          style={{
            width: getDeterministicWidth(i),
            backgroundImage: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%)',
            backgroundSize: '200% 100%',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

