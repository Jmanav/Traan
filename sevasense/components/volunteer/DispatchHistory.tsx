'use client';

import { Volunteer } from '@/lib/types';

interface DispatchHistoryProps {
  volunteer: Volunteer;
}

const MOCK_HISTORY = [
  { time: '14:02:11', event: 'SYS_ALERT: Assigned to INCIDENT_LA_99', highlight: true },
  { time: '13:45:00', event: 'Check-in confirmed: SECTOR_4_CP', highlight: false },
  { time: '13:44:12', event: 'Telemetry sync complete. Vitals nominal.', highlight: false },
  { time: '11:20:05', event: 'Mission COMPLETED: MED_EVAC_LA_82', highlight: true },
  { time: '10:15:33', event: 'En route to target coordinates...', highlight: false },
  { time: '09:00:00', event: 'Status update: READY – AVAILABLE', highlight: false },
];

export default function DispatchHistory({ volunteer }: DispatchHistoryProps) {
  return (
    <div className="card-tactical p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green" />
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            Activity Timeline / Recent Activity
          </span>
        </div>
        <span className="text-[9px] font-mono text-muted/30 uppercase">TERMINAL_OUT</span>
      </div>

      <div className="p-4 bg-[#070b14] font-mono text-sm space-y-2">
        {MOCK_HISTORY.map((entry, i) => (
          <div key={i} className="flex items-start gap-3">
            {i === 0 && (
              <span className="text-orange mt-0.5">▸</span>
            )}
            {i !== 0 && (
              <span className="text-muted/20 mt-0.5"> </span>
            )}
            <span className="text-muted/60 whitespace-nowrap">[{entry.time}]</span>
            <span className={entry.highlight ? 'text-orange' : 'text-muted/80'}>
              {entry.event}
            </span>
          </div>
        ))}
        
        {/* Terminal cursor */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-green">&gt;_</span>
          <span className="text-muted/30 animate-breathe">Awaiting input...</span>
        </div>
      </div>
    </div>
  );
}
