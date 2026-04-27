'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

interface AvailabilityToggleProps {
  initialAvailable: boolean;
  volunteerId?: string;
  onToggle?: (available: boolean) => void;
}

export default function AvailabilityToggle({
  initialAvailable,
  volunteerId,
  onToggle,
}: AvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState(initialAvailable);
  const [showToast, setShowToast] = useState(false);
  const [toastError, setToastError] = useState(false);

  const toggle = async () => {
    const newState = !isAvailable;

    // Optimistic update — change UI immediately before API responds
    setIsAvailable(newState);
    onToggle?.(newState);

    if (API_BASE && volunteerId) {
      // --- Live API path ---
      try {
        const res = await fetch(`${API_BASE}/api/volunteers/${volunteerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isAvailable: newState }),
        });

        if (!res.ok) {
          // Revert optimistic update on error
          setIsAvailable(!newState);
          onToggle?.(!newState);
          setToastError(true);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          return;
        }

        // Success toast
        setToastError(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch {
        // Network error — revert
        setIsAvailable(!newState);
        onToggle?.(!newState);
        setToastError(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } else {
      // --- Local-only fallback (no env var or no volunteerId) ---
      setToastError(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <>
      <button
        onClick={toggle}
        className={`relative flex items-center gap-3 px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all ${
          isAvailable
            ? 'bg-green/10 border border-green/30 text-green hover:bg-green/15'
            : 'bg-elevated border border-border text-muted hover:border-muted/50'
        }`}
      >
        {/* Toggle track */}
        <div className={`w-8 h-4 rounded-full transition-colors ${isAvailable ? 'bg-green/30' : 'bg-border'}`}>
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 mt-0.5 ${
              isAvailable
                ? 'translate-x-4.5 bg-green ml-4'
                : 'translate-x-0.5 bg-muted ml-0.5'
            }`}
          />
        </div>
        {isAvailable ? 'AVAILABLE' : 'OFF DUTY'}
      </button>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 toast-enter">
          <div
            className={`bg-surface rounded-lg px-4 py-3 shadow-xl flex items-center gap-2 border ${
              toastError ? 'border-critical/30' : 'border-green/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${toastError ? 'bg-critical' : 'bg-green'}`}
            />
            <span
              className={`text-xs font-mono uppercase ${toastError ? 'text-critical' : 'text-green'}`}
            >
              {toastError ? 'Update failed' : 'Status updated'}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
