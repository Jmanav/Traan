'use client';

import { useDashboard } from '@/lib/context/DashboardContext';
import IncidentDetail from './IncidentDetail';
import VolunteerMatchList from './VolunteerMatchList';
import DispatchPanel from './DispatchPanel';
import { Zap, Crosshair } from 'lucide-react';

export default function RightPanel() {
  const { selectedIncident } = useDashboard();

  return (
    <div className="h-screen flex flex-col bg-surface border-l border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-orange" />
          <span className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-orange">
            Send Help
          </span>
        </div>
        {selectedIncident && (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-orange/30 text-orange rounded">
            Awaiting
          </span>
        )}
      </div>

      {selectedIncident ? (
        <div className="flex-1 overflow-y-auto">
          <IncidentDetail incident={selectedIncident} />
          <VolunteerMatchList incident={selectedIncident} />
          <DispatchPanel incident={selectedIncident} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-elevated/50 border border-border flex items-center justify-center mb-4">
            <Crosshair size={24} className="text-muted/30" />
          </div>
          <p className="text-sm text-muted font-mono leading-relaxed">
            Select an incident from the feed or map to begin dispatch.
          </p>
        </div>
      )}
    </div>
  );
}
