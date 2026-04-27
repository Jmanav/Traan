'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Volunteer, Coordinates } from '@/lib/types';
import { MOCK_VOLUNTEERS } from '@/lib/mock/volunteers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// ---------------------------------------------------------------------------
// Field mapper — converts raw API response to the Volunteer TypeScript type.
// ---------------------------------------------------------------------------
function toVolunteer(raw: Record<string, unknown>): Volunteer {
  const coords = raw.coordinates as { lat: number; lng: number } | null;
  return {
    id: raw.id as string,
    name: (raw.name as string) ?? '',
    phone: (raw.phone as string) ?? '',
    skills: (raw.skills as string[]) ?? [],
    languages: (raw.languages as string[]) ?? [],
    coordinates: (coords ?? { lat: 0, lng: 0 }) as Coordinates,
    isAvailable: Boolean(raw.isAvailable),
    lastSeen: (raw.lastSeen as string) ?? new Date().toISOString(),
    ngoId: (raw.ngoId as string) ?? '',
    dispatchCount: (raw.dispatchCount as number) ?? 0,
    avatarUrl: (raw.avatarUrl as string) ?? undefined,
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
export function useVolunteers() {
  // --- Live API path (when NEXT_PUBLIC_API_BASE_URL is set) ---
  if (API_BASE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error, isLoading } = useSWR<Record<string, unknown>[]>(
      `${API_BASE}/api/volunteers`,
      fetcher,
      { refreshInterval: 15_000 }
    );

    const volunteers: Volunteer[] = (data ?? []).map(toVolunteer);
    const availableVolunteers = volunteers.filter((v) => v.isAvailable);
    const deployedCount = volunteers.filter((v) => !v.isAvailable).length;

    return {
      volunteers,
      availableVolunteers,
      deployedCount,
      loading: isLoading,
      error: error as Error | undefined,
    };
  }

  // --- Mock fallback path (when env var is not set) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const timer = setTimeout(() => {
      setVolunteers(MOCK_VOLUNTEERS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const availableVolunteers = volunteers.filter((v) => v.isAvailable);
  const deployedCount = volunteers.filter((v) => !v.isAvailable).length;

  return {
    volunteers,
    availableVolunteers,
    deployedCount,
    loading,
    error: undefined,
  };
}
