export const SEVERITY = {
  critical: { color: '#EF4444', label: 'CRITICAL', glow: 'shadow-[0_0_12px_#EF4444]', bg: 'bg-critical', border: 'border-critical' },
  urgent:   { color: '#F97316', label: 'URGENT',   glow: 'shadow-[0_0_12px_#F97316]', bg: 'bg-urgent',   border: 'border-urgent' },
  moderate: { color: '#EAB308', label: 'MODERATE', glow: '',                           bg: 'bg-moderate', border: 'border-moderate' },
} as const;

export type SeverityTier = keyof typeof SEVERITY;

export function scoreToTier(score: number): SeverityTier {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'urgent';
  return 'moderate';
}

export function getSeverityClass(tier: SeverityTier): string {
  return `severity-border-${tier}`;
}

export function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}
