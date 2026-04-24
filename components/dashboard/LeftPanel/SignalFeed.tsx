'use client';

import { useIncidents } from '@/lib/hooks/useIncidents';
import { useDashboard } from '@/lib/context/DashboardContext';
import LoadingPulse from '@/components/shared/LoadingPulse';
import SigOverlay from './SigOverlay';
import { AlertTriangle, ChevronRight, Activity, Grid } from 'lucide-react';
import { useState } from 'react';

export default function SignalFeed() {
  const { incidents, loading } = useIncidents();
  const { selectedIncident, setSelectedIncident, panToCoordinates } = useDashboard();
  const [showOverlay, setShowOverlay] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 px-5 py-4">
        <LoadingPulse lines={3} />
      </div>
    );
  }

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const criticalCount = activeIncidents.filter((i) => i.tier === 'critical').length;

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-2 min-h-0 border-t border-border/30 bg-surface">
      <button
        onClick={() => setShowOverlay(true)}
        className="group relative w-full overflow-hidden rounded-xl bg-elevated/40 border border-border/50 hover:border-orange/40 hover:bg-elevated transition-all duration-300 p-4"
      >
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 bg-orange/5 opacity-0 group-hover:opacity-100 transition-opacity blur-md rounded-xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-orange animate-pulse" />
            <span className="font-space-grotesk font-bold text-sm text-primary uppercase tracking-widest">
              Crisis Board
            </span>
          </div>
          <ChevronRight size={16} className="text-muted group-hover:text-orange group-hover:translate-x-1 transition-all" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider mb-0.5">Active Signals</span>
            <span className="text-2xl font-mono font-bold text-white">{activeIncidents.length}</span>
          </div>
          {criticalCount > 0 && (
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] font-mono text-critical/70 uppercase tracking-wider mb-0.5">Critical</span>
              <div className="flex items-center gap-1.5 text-critical">
                <AlertTriangle size={12} className="animate-pulse" />
                <span className="text-lg font-mono font-bold">{criticalCount}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 w-full bg-orange/10 border border-orange/30 group-hover:bg-orange group-hover:text-white text-orange text-[10px] font-mono font-bold uppercase tracking-widest py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all group-hover:shadow-glow-orange">
          <Grid size={12} />
          View All Grid Data
        </div>
      </button>

      {/* SIG Overlay (full-screen modal) */}
      {showOverlay && (
        <SigOverlay
          incidents={activeIncidents}
          selectedIncidentId={selectedIncident?.id}
          onClose={() => setShowOverlay(false)}
          onSelectForDispatch={(incident) => {
            setSelectedIncident(incident);
            setShowOverlay(false);
          }}
          onViewOnMap={(incident) => {
            panToCoordinates(incident.coordinates.lat, incident.coordinates.lng);
            setSelectedIncident(incident);
            setShowOverlay(false);
          }}
        />
      )}
    </div>
  );
}
