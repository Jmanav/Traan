interface NeedTypePillProps {
  needType: string;
}

const NEED_COLORS: Record<string, string> = {
  rescue: '#EF4444',
  medical: '#F97316',
  evacuation: '#3B82F6',
  food: '#10B981',
  shelter: '#8B5CF6',
  water: '#06B6D4',
  hazmat: '#EF4444',
};

export default function NeedTypePill({ needType }: NeedTypePillProps) {
  const color = NEED_COLORS[needType] || '#6B7280';
  const label = needType.toUpperCase().replace('_', ' ');

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded font-semibold"
      style={{
        color,
        border: `1px solid ${color}50`,
        backgroundColor: `${color}10`,
      }}
    >
      {label}
    </span>
  );
}
