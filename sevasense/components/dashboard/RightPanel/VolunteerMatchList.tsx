'use client';

import { Incident, Volunteer, VolunteerMatch } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { useDashboard } from '@/lib/context/DashboardContext';
import { useVolunteers } from '@/lib/hooks/useVolunteers';

interface VolunteerMatchListProps {
  incident: Incident;
}

// ---------------------------------------------------------------------------
// Matching algorithm — runs against real volunteers from the API/mock hook.
// ---------------------------------------------------------------------------
const NEED_TO_SKILLS: Record<string, string[]> = {
  rescue:     ['flood_rescue', 'navigation'],
  medical:    ['medical', 'first_aid', 'trauma_support'],
  evacuation: ['evacuation_coord', 'driving_4x4'],
  food:       ['logistics'],
  shelter:    ['logistics', 'evacuation_coord'],
  water:      ['logistics'],
  hazmat:     ['medical', 'first_aid'],
};

function computeMatches(
  incidentLat: number,
  incidentLng: number,
  needTypes: string[],
  volunteers: Volunteer[],
): VolunteerMatch[] {
  const requiredSkills = new Set(
    needTypes.flatMap((n) => NEED_TO_SKILLS[n] ?? [])
  );

  return volunteers
    .filter((v) => v.isAvailable)
    .map((v) => {
      const dLat = v.coordinates.lat - incidentLat;
      const dLng = v.coordinates.lng - incidentLng;
      const distanceKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111 * 10) / 10;

      const matched = requiredSkills.size > 0
        ? v.skills.filter((s) => requiredSkills.has(s)).length
        : 0;
      const skillMatchScore = requiredSkills.size > 0
        ? Math.min(100, Math.round((matched / requiredSkills.size) * 100))
        : 50;

      const proximityScore = Math.max(0, 100 - distanceKm * 5);
      const compositeScore = skillMatchScore * 0.6 + proximityScore * 0.4;

      return { volunteer: v, distanceKm, skillMatchScore, compositeScore };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 5)
    .map(({ volunteer, distanceKm, skillMatchScore }) => ({
      volunteer,
      distanceKm,
      skillMatchScore,
    }));
}

export default function VolunteerMatchList({ incident }: VolunteerMatchListProps) {
  const [matches, setMatches] = useState<VolunteerMatch[]>([]);
  const { selectedVolunteerId, setSelectedVolunteerId } = useDashboard();
  const { volunteers } = useVolunteers();

  // Stable ref to avoid setSelectedVolunteerId causing infinite loops
  const setVolunteerRef = useRef(setSelectedVolunteerId);
  setVolunteerRef.current = setSelectedVolunteerId;

  // Stable incident identity check
  const incidentId = incident.id;
  const incidentLat = incident.coordinates.lat;
  const incidentLng = incident.coordinates.lng;
  const needTypesKey = incident.needTypes.join(',');

  // Stable volunteers identity — only recompute when volunteer IDs or availability changes
  const volunteersKey = volunteers.map(v => `${v.id}:${v.isAvailable}`).join('|');

  useEffect(() => {
    if (volunteers.length === 0) return;
    const m = computeMatches(incidentLat, incidentLng, needTypesKey.split(','), volunteers);
    setMatches(m);
    if (m.length > 0) setVolunteerRef.current(m[0].volunteer.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId, incidentLat, incidentLng, needTypesKey, volunteersKey]);

  if (matches.length === 0) {
    return (
      <div className="px-5 py-4 border-b border-border/30">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-3">
          Available Helpers
        </div>
        <p className="text-xs font-mono text-muted/50 animate-breathe">
          No available volunteers found.
        </p>
      </div>
    );
  }

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
          const filledSegments = Math.round((match.skillMatchScore / 100) * 5);
          const shortId = match.volunteer.id.includes('_')
            ? match.volunteer.id.split('_')[1]
            : match.volunteer.id.slice(-4).toUpperCase();

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
              {/* Avatar */}
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
                    UNIT-{shortId}
                  </span>
                  <span className="text-[10px] font-mono text-muted">•</span>
                  <span className="text-[10px] font-mono text-data">
                    {match.distanceKm} KM
                  </span>
                </div>

                {/* Skill bar + Language tags */}
                <div className="flex items-center gap-2 mt-1.5">
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
                              ? i < 2 ? '#10B981' : i < 4 ? '#3B82F6' : '#F97316'
                              : 'var(--border)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex-1" />
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
