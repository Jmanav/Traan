'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Incident, Coordinates, SeverityTier, IncidentStatus, SignalType } from '@/lib/types';
import { MOCK_INCIDENTS } from '@/lib/mock/incidents';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// ---------------------------------------------------------------------------
// Field mapper — converts raw API response to the Incident TypeScript type.
// Provides safe defaults for fields absent from the backend DB schema
// (confidence, signalType, languageDetected) as documented in context.md.
// ---------------------------------------------------------------------------
function toIncident(raw: Record<string, unknown>): Incident {
  const coords = raw.coordinates as { lat: number; lng: number } | null;
  return {
    id: raw.id as string,
    locationRaw: (raw.locationRaw as string) ?? '',
    coordinates: (coords ?? { lat: 0, lng: 0 }) as Coordinates,
    severityScore: (raw.severityScore as number) ?? 0,
    tier: (raw.tier as SeverityTier) ?? 'moderate',
    needTypes: (raw.needTypes as string[]) ?? [],
    vulnerableGroups: (raw.vulnerableGroups as string[]) ?? [],
    affectedCount: (raw.affectedCount as number) ?? 0,
    accessConstraints: (raw.accessConstraints as string) ?? '',
    status: (raw.status as IncidentStatus) ?? 'active',
    signalCount: (raw.signalCount as number) ?? 1,
    // Fields not stored in the backend DB — provide safe defaults
    confidence: (raw.confidence as number) ?? 0.8,
    signalType: (raw.signalType as SignalType) ?? 'text',
    languageDetected: (raw.languageDetected as string) ?? 'Hindi',
    createdAt: (raw.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (raw.updatedAt as string) ?? new Date().toISOString(),
  };
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  });

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useIncidents() {
  // --- Live API path (when NEXT_PUBLIC_API_BASE_URL is set) ---
  if (API_BASE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error, isLoading } = useSWR<Record<string, unknown>[]>(
      `${API_BASE}/api/incidents`,
      fetcher,
      { refreshInterval: 10_000 }
    );

    const incidents: Incident[] = (data ?? []).map(toIncident);
    const activeIncidents = incidents.filter((i) => i.status === 'active');
    const dispatchedIncidents = incidents.filter((i) => i.status === 'dispatched');

    return {
      incidents,
      activeIncidents,
      dispatchedIncidents,
      loading: isLoading,
      error: error as Error | undefined,
    };
  }

  // --- Mock fallback path (when env var is not set) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [incidents, setIncidents] = useState<Incident[]>([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const timer = setTimeout(() => {
      setIncidents(
        [...MOCK_INCIDENTS].sort((a, b) => b.severityScore - a.severityScore)
      );
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const activeIncidents = incidents.filter((i) => i.status === 'active');
  const dispatchedIncidents = incidents.filter((i) => i.status === 'dispatched');

  return {
    incidents,
    activeIncidents,
    dispatchedIncidents,
    loading,
    error: undefined,
  };
}
