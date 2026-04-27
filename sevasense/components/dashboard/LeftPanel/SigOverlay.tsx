'use client';

import { Incident } from '@/lib/types';
import { SEVERITY, timeAgo } from '@/lib/severity';
import NeedTypePill from '@/components/shared/NeedTypePill';
import SignalTypeIcon from '@/components/shared/SignalTypeIcon';
import { X, Target, MapPin, Users, AlertTriangle, Crosshair, Zap } from 'lucide-react';
import { useEffect } from 'react';

interface SigOverlayProps {
  incidents: Incident[];
  onClose: () => void;
  onSelectForDispatch: (incident: Incident) => void;
  onViewOnMap: (incident: Incident) => void;
  selectedIncidentId?: string | null;
}

export default function SigOverlay({
  incidents,
  onClose,
  onSelectForDispatch,
  onViewOnMap,
  selectedIncidentId,
}: SigOverlayProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const criticalCount = incidents.filter((i) => i.tier === 'critical').length;
  const urgentCount = incidents.filter((i) => i.tier === 'urgent').length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#03060C]/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Overlay content */}
      <div className="relative w-[90vw] max-w-[1000px] max-h-[85vh] bg-surface border border-border/80 rounded-2xl shadow-left-glow flex flex-col animate-fade-in overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange to-transparent" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-orange" />
              <span className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-orange">
                Active Signals
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-critical/20 border border-critical/30 text-critical font-bold rounded">
                {criticalCount} Critical
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-orange/20 border border-orange/30 text-orange font-bold rounded">
                {urgentCount} Urgent
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-elevated border border-border text-primary rounded">
                {incidents.length} Total
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-critical/10 border border-critical/30 hover:bg-critical hover:text-white text-critical transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Grid of incidents */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {incidents.map((incident) => {
              const config = SEVERITY[incident.tier];
              const isSelected = selectedIncidentId === incident.id;

              return (
                <div
                  key={incident.id}
                  className={`
                    relative p-4 rounded-xl border-l-[3px] transition-all duration-200
                    ${isSelected
                      ? 'bg-orange/10 border border-orange/20'
                      : 'bg-elevated/40 border border-border/30 hover:bg-elevated hover:border-border/60'
                    }
                  `}
                  style={{ borderLeftColor: config.color }}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-xs font-bold uppercase"
                        style={{ color: config.color }}
                      >
                        SIG-{incident.id.substring(0, 4).toUpperCase()}
                      </span>
                      <span
                        className="px-1.5 py-0.5 text-[8px] font-mono uppercase rounded"
                        style={{
                          color: config.color,
                          background: `${config.color}12`,
                          border: `1px solid ${config.color}25`,
                        }}
                      >
                        {config.label}
                      </span>
                      <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase rounded bg-elevated border border-border text-muted">
                        {incident.status}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted whitespace-nowrap">
                      T-{timeAgo(incident.createdAt).replace(' ago', '').replace('just now', '00m')}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-1.5 mb-2">
                    <MapPin size={11} className="text-muted shrink-0 mt-0.5" />
                    <span className="text-[11px] text-primary/80 leading-tight">
                      {incident.locationRaw}
                    </span>
                  </div>

                  {/* Severity bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-border/30 rounded-full h-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${incident.severityScore}%`,
                          backgroundColor: config.color,
                          boxShadow: `0 0 6px ${config.color}40`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold" style={{ color: config.color }}>
                      {incident.severityScore}
                    </span>
                  </div>

                  {/* Stats row */}
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
                    <div className="flex-1" />
                    <SignalTypeIcon type={incident.signalType} size={11} />
                  </div>

                  {/* Need pills */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {incident.needTypes.map((need) => (
                      <NeedTypePill key={need} needType={need} />
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectForDispatch(incident)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-orange hover:bg-orange/90 text-white text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all hover:shadow-glow-orange"
                    >
                      <Target size={10} />
                      Dispatch
                    </button>
                    <button
                      onClick={() => onViewOnMap(incident)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-border text-muted hover:text-primary hover:border-orange/30 text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all"
                    >
                      <Crosshair size={10} />
                      Locate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/30 shrink-0 flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
            Press ESC to close · Click card to dispatch
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted border border-border rounded-lg hover:text-primary hover:border-orange/30 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
