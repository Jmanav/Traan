'use client';

import { Incident } from '@/lib/types';
import { SEVERITY, timeAgo } from '@/lib/severity';
import NeedTypePill from '@/components/shared/NeedTypePill';
import { MapPin, Target, Users, X, Crosshair, AlertTriangle } from 'lucide-react';

interface SigPopupProps {
  incident: Incident;
  onClose: () => void;
  onSelectForDispatch: () => void;
  onViewOnMap: () => void;
}

export default function SigPopup({ incident, onClose, onSelectForDispatch, onViewOnMap }: SigPopupProps) {
  const config = SEVERITY[incident.tier];

  return (
    <div
      className="absolute left-full ml-2 top-0 z-50 animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-surface/97 backdrop-blur-md border border-border rounded-xl p-4 shadow-2xl w-[260px] corner-marks">
        {/* Top accent line */}
        <div
          className="absolute top-0 left-4 right-4 h-[2px] rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${config.color}, transparent)` }}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase" style={{ color: config.color }}>
              SIG-{incident.id.substring(0, 4).toUpperCase()}
            </span>
            <span
              className="px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider rounded"
              style={{
                color: config.color,
                background: `${config.color}15`,
                border: `1px solid ${config.color}30`,
              }}
            >
              {config.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-0.5 -mt-0.5 -mr-0.5"
          >
            <X size={12} />
          </button>
        </div>

        {/* Location */}
        <div className="flex items-start gap-1.5 mb-3">
          <MapPin size={11} className="text-muted shrink-0 mt-0.5" />
          <span className="text-[11px] text-primary/80 leading-tight">
            {incident.locationRaw}
          </span>
        </div>

        {/* Severity bar */}
        <div className="mb-3 pb-3 border-b border-border/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono text-muted uppercase">Urgency</span>
            <span className="text-[11px] font-mono font-bold" style={{ color: config.color }}>
              {incident.severityScore}/100
            </span>
          </div>
          <div className="w-full bg-border/30 rounded-full h-1">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${incident.severityScore}%`,
                backgroundColor: config.color,
                boxShadow: `0 0 6px ${config.color}50`,
              }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 mb-3 text-[10px]">
          <div className="flex items-center gap-1">
            <Users size={10} className="text-muted" />
            <span className="font-mono font-bold text-primary">{incident.affectedCount}</span>
            <span className="text-muted">affected</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle size={10} className="text-muted" />
            <span className="font-mono text-data">{incident.signalCount} signals</span>
          </div>
        </div>

        {/* Need types */}
        <div className="flex flex-wrap gap-1 mb-3">
          {incident.needTypes.slice(0, 3).map((need) => (
            <NeedTypePill key={need} needType={need} />
          ))}
        </div>

        {/* Action buttons */}
        <div className="space-y-1.5">
          <button
            onClick={onSelectForDispatch}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-orange hover:bg-orange/90 text-white text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all hover:shadow-glow-orange"
          >
            <Target size={11} />
            Select for Dispatch
          </button>
          <button
            onClick={onViewOnMap}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-border text-muted hover:text-primary hover:border-orange/30 text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all"
          >
            <Crosshair size={11} />
            View on Map
          </button>
        </div>
      </div>
    </div>
  );
}
