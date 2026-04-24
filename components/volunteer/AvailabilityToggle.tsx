'use client';

import { useState } from 'react';

interface AvailabilityToggleProps {
  initialAvailable: boolean;
  onToggle?: (available: boolean) => void;
}

export default function AvailabilityToggle({ initialAvailable, onToggle }: AvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState(initialAvailable);
  const [showToast, setShowToast] = useState(false);

  const toggle = () => {
    const newState = !isAvailable;
    setIsAvailable(newState);
    onToggle?.(newState);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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
          <div className="bg-surface border border-green/30 rounded-lg px-4 py-3 shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green" />
            <span className="text-xs font-mono text-green uppercase">
              Status updated
            </span>
          </div>
        </div>
      )}
    </>
  );
}
