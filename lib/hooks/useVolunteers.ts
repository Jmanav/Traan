'use client';

import { useEffect, useState } from 'react';
import { Volunteer } from '@/lib/types';
import { MOCK_VOLUNTEERS } from '@/lib/mock/volunteers';

export function useVolunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVolunteers(MOCK_VOLUNTEERS);
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const availableVolunteers = volunteers.filter((v) => v.isAvailable);
  const deployedCount = volunteers.filter((v) => !v.isAvailable).length;

  return { volunteers, availableVolunteers, deployedCount, loading };
}
