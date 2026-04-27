'use client';

import { Incident } from '@/lib/types';
import { SEVERITY } from '@/lib/severity';
import NeedTypePill from '@/components/shared/NeedTypePill';
import { X, Users, AlertTriangle, Brain, Target } from 'lucide-react';
import { useEffect, useState } from 'react';

interface IncidentPopupProps {
  incident: Incident;
  onClose: () => void;
  onSelect: () => void;
}

export default function IncidentPopup({ incident, onClose, onSelect }: IncidentPopupProps) {
  const config = SEVERITY[incident.tier];
  const [gaugeProgress, setGaugeProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setGaugeProgress(incident.severityScore), 100);
    return () => clearTimeout(timer);
  }, [incident.severityScore]);

  // SVG arc gauge parameters
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const dashOffset = arcLength - (arcLength * gaugeProgress) / 100;

  return (
    <div
      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-surface/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-2xl w-[280px] corner-marks">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs font-bold uppercase" style={{ color: config.color }}>
                SIG-{incident.id.substring(0, 4).toUpperCase()}_CTX
              </span>
              <svg width="8" height="8" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" fill={config.color} />
              </svg>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>

        {/* Severity gauge */}
        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-border/30">
          <div className="flex-1">
            <div className="text-[10px] font-mono text-muted uppercase mb-1">Urgency Level</div>
            <div className="flex items-center justify-between">
              <div className="w-full bg-border/30 rounded-full h-1.5 mr-3">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${gaugeProgress}%`,
                    backgroundColor: config.color,
                    boxShadow: `0 0 8px ${config.color}60`,
                  }}
                />
              </div>
              <span className="font-mono text-sm font-bold" style={{ color: config.color }}>
                {incident.severityScore}/100
              </span>
            </div>
          </div>
        </div>

        {/* Need types */}
        <div className="mb-3">
          <div className="text-[10px] font-mono text-muted uppercase mb-1.5">Needs</div>
          <div className="flex flex-wrap gap-1.5">
            {incident.needTypes.map((need) => (
              <NeedTypePill key={need} needType={need} />
            ))}
          </div>
        </div>

        {/* Important notes */}
        {incident.accessConstraints && (
          <div className="mb-3 pb-3 border-b border-border/30">
            <div className="text-[10px] font-mono text-muted uppercase mb-1">Important Notes</div>
            <p className="text-xs text-primary/80 leading-relaxed">
              {incident.accessConstraints}
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3 text-xs">
          <div className="flex items-center gap-1 text-primary">
            <Users size={12} />
            <span className="font-mono font-bold">{incident.affectedCount}</span>
            <span className="text-muted">affected</span>
          </div>
          <div className="flex items-center gap-1 text-data">
            <Brain size={12} />
            <span className="font-mono">{incident.confidence.toFixed(2)}</span>
          </div>
        </div>

        {/* Select button */}
        <button
          onClick={onSelect}
          className="w-full flex items-center justify-center gap-2 py-2 bg-orange/90 hover:bg-orange text-white text-xs font-mono uppercase tracking-wider rounded transition-all hover:shadow-glow-orange"
        >
          <Target size={12} />
          Select for Dispatch
        </button>
      </div>
    </div>
  );
}
