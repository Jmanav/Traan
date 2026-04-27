import { SEVERITY, SeverityTier } from '@/lib/severity';

interface SeverityBadgeProps {
  tier: SeverityTier;
  size?: 'sm' | 'md' | 'lg';
  showGlow?: boolean;
}

export default function SeverityBadge({ tier, size = 'sm', showGlow = true }: SeverityBadgeProps) {
  const config = SEVERITY[tier];
  
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-4 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-bold rounded
        ${sizeClasses[size]}
        ${showGlow && tier === 'critical' ? config.glow : ''}
      `}
      style={{
        color: config.color,
        backgroundColor: `${config.color}15`,
        border: `1px solid ${config.color}40`,
      }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${tier === 'critical' ? 'animate-availability-pulse' : ''}`}
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}
