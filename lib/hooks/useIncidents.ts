'use client';

import { useEffect, useState } from 'react';
import { Incident } from '@/lib/types';
import { MOCK_INCIDENTS } from '@/lib/mock/incidents';

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Using mock data for prototype
    // TODO: Replace with Firebase Realtime Database listener
    const timer = setTimeout(() => {
      setIncidents(
        [...MOCK_INCIDENTS].sort((a, b) => b.severityScore - a.severityScore)
      );
      setLoading(false);
    }, 800); // Simulate network delay

    return () => clearTimeout(timer);
  }, []);

  const activeIncidents = incidents.filter((i) => i.status === 'active');
  const dispatchedIncidents = incidents.filter((i) => i.status === 'dispatched');

  return { incidents, activeIncidents, dispatchedIncidents, loading };
}
