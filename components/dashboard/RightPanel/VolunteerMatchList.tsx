'use client';

import { Incident, VolunteerMatch } from '@/lib/types';
import { getVolunteerMatches } from '@/lib/mock/volunteers';
import { useState, useEffect } from 'react';
import { Shield, Check } from 'lucide-react';

import { useDashboard } from '@/lib/context/DashboardContext';

interface VolunteerMatchListProps {
  incident: Incident;
}

export default function VolunteerMatchList({ incident }: VolunteerMatchListProps) {
  const [matches, setMatches] = useState<VolunteerMatch[]>([]);
  const { selectedVolunteerId, setSelectedVolunteerId } = useDashboard();

  useEffect(() => {
    const m = getVolunteerMatches(
      incident.coordinates.lat,
      incident.coordinates.lng,
      incident.needTypes
    );
    setMatches(m);
    // Force reset the globally selected volunteer when an incident changes
    if (m.length > 0) setSelectedVolunteerId(m[0].volunteer.id);
  }, [incident, setSelectedVolunteerId]);

  return (
    <div className="px-5 py-4 border-b border-border/30">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-3">
        Available Helpers
      </div>

      <div className="space-y-2">
        {matches.map((match, index) => {
          const isSelected = selectedVolunteerId === match.volunteer.id;
          const initials = match.volunteer.name
            .split(' ')
            .map((n) => n[0])
            .join('');

          // Skill bar: 5 segments
          const filledSegments = Math.round((match.skillMatchScore / 100) * 5);

          return (
            <button
              key={match.volunteer.id}
              onClick={() => setSelectedVolunteerId(match.volunteer.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                isSelected
                  ? 'bg-elevated border border-orange/20'
                  : 'hover:bg-elevated/50 border border-transparent'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Avatar / Initials */}
              <div className="w-9 h-9 rounded-full bg-base border border-border flex items-center justify-center text-xs font-mono font-bold text-muted shrink-0">
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-space-grotesk font-semibold text-primary truncate">
                    {match.volunteer.name}
                  </span>
                  {isSelected && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-green/10 text-green border border-green/20 rounded uppercase">
                      Match {match.skillMatchScore}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted">
                    UNIT-{match.volunteer.id.split('_')[1]}
                  </span>
                  <span className="text-[10px] font-mono text-muted">•</span>
                  <span className="text-[10px] font-mono text-data">
                    {match.distanceKm} KM
                  </span>
                </div>

                {/* Skill bar + Language tags */}
                <div className="flex items-center gap-2 mt-1.5">
                  {/* Skill bar */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-sm transition-all ${
                          i < filledSegments ? 'w-5' : 'w-3'
                        }`}
                        style={{
                          backgroundColor:
                            i < filledSegments
                              ? i < 2
                                ? '#10B981'
                                : i < 4
                                ? '#3B82F6'
                                : '#F97316'
                              : 'var(--border)',
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex-1" />

                  {/* Language tags */}
                  <div className="flex gap-1">
                    {match.volunteer.languages.slice(0, 2).map((lang) => (
                      <span
                        key={lang}
                        className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-elevated border border-border rounded text-muted"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selection icon */}
              {isSelected && (
                <div className="w-6 h-6 rounded bg-green/10 border border-green/20 flex items-center justify-center shrink-0">
                  <Shield size={12} className="text-green" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
