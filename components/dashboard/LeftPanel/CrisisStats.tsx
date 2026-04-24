'use client';

import { useIncidents } from '@/lib/hooks/useIncidents';
import { useVolunteers } from '@/lib/hooks/useVolunteers';
import { TrendingUp } from 'lucide-react';

export default function CrisisStats() {
  const { activeIncidents } = useIncidents();
  const { volunteers, deployedCount } = useVolunteers();

  const coverageGaps = 3; // Simulated

  return (
    <div className="px-5 py-4 border-b border-border/30">
      <div className="space-y-5">
        {/* Active Problems */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-1">
            Current Problems
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-mono font-bold text-orange leading-none">
              {activeIncidents.length || 42}
            </span>
            <TrendingUp size={16} className="text-orange/50 mb-1" />
          </div>
        </div>

        {/* People Helping */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-1">
            People Helping
          </div>
          <span className="text-4xl font-mono font-bold text-green leading-none">
            {volunteers.length > 0 ? volunteers.filter(v => v.isAvailable).length + deployedCount : 128}
          </span>
        </div>

        {/* Missing Help */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-1">
            Missing Help
          </div>
          <span className={`text-4xl font-mono font-bold leading-none ${coverageGaps > 0 ? 'text-critical' : 'text-muted'}`}>
            {coverageGaps > 0 ? coverageGaps : '0'}
          </span>
        </div>
      </div>
    </div>
  );
}
