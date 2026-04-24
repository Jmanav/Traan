'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export function useSignalCounter(initialCount: number = 347) {
  const [count, setCount] = useState(initialCount);
  const [isFlashing, setIsFlashing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Simulate incoming signals at random intervals
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 8000; // 3–11 seconds
      intervalRef.current = setTimeout(() => {
        setCount((prev) => prev + 1);
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 800);
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  const formattedCount = useCallback(() => {
    const str = count.toString().padStart(9, '0');
    return `${str.slice(0, 3)},${str.slice(3, 6)},${str.slice(6)}`;
  }, [count]);

  return { count, formattedCount: formattedCount(), isFlashing };
}
