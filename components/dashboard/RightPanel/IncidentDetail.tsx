'use client';

import { Incident } from '@/lib/types';
import { SEVERITY, timeAgo } from '@/lib/severity';
import SeverityBadge from '@/components/shared/SeverityBadge';
import NeedTypePill from '@/components/shared/NeedTypePill';
import SignalTypeIcon from '@/components/shared/SignalTypeIcon';
import { MapPin, Target, Users, AlertTriangle, Globe, Timer } from 'lucide-react';

interface IncidentDetailProps {
  incident: Incident;
}

export default function IncidentDetail({ incident }: IncidentDetailProps) {
  const config = SEVERITY[incident.tier];

  return (
    <div className="px-5 py-4 border-b border-border/30">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-3">
        Report Details
      </div>

      {/* Key-value data rows */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted uppercase">ID:</span>
          <span className="text-[11px] font-mono text-primary font-bold">SIG-{incident.id.split('_')[1]}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted uppercase">Type:</span>
          <span className="text-[11px] font-mono font-bold" style={{ color: config.color }}>
            {incident.needTypes[0]?.toUpperCase().replace('_', ' ') || 'GENERAL'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted uppercase">Dist:</span>
          <span className="text-[11px] font-mono text-primary font-bold">
            {(Math.random() * 5 + 0.5).toFixed(1)} KM
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted uppercase">Req:</span>
          <span className="text-[11px] font-mono text-primary font-bold">
            {incident.needTypes.slice(0, 2).join(', ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Severity gauge bar */}
      <div className="mt-4 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-muted uppercase">Urgency Level</span>
          <span className="text-[11px] font-mono font-bold" style={{ color: config.color }}>
            {incident.severityScore}/100
          </span>
        </div>
        <div className="w-full bg-border/30 rounded-full h-1.5">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${incident.severityScore}%`,
              backgroundColor: config.color,
              boxShadow: `0 0 8px ${config.color}40`,
            }}
          />
        </div>
      </div>

      {/* Need type pills */}
      <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
        {incident.needTypes.map((need) => (
          <NeedTypePill key={need} needType={need} />
        ))}
      </div>

      {/* Access constraints */}
      {incident.accessConstraints && (
        <div className="mt-3 p-2.5 bg-elevated/50 border border-border/30 rounded-lg">
          <div className="text-[10px] font-mono text-muted uppercase mb-1">Important Notes</div>
          <p className="text-xs text-primary/80 leading-relaxed">
            {incident.accessConstraints}
          </p>
        </div>
      )}
    </div>
  );
}
