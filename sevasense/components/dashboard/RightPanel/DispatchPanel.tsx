'use client';

import { useState } from 'react';
import { Incident } from '@/lib/types';
import { Send, Users, Loader2, Check, ArrowRight } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

interface DispatchPanelProps {
  incident: Incident;
  selectedVolunteerId?: string;
}

type DispatchState = 'ready' | 'sending' | 'sent' | 'confirmed' | 'en_route' | 'error';

export default function DispatchPanel({ incident, selectedVolunteerId }: DispatchPanelProps) {
  const [state, setState] = useState<DispatchState>('ready');

  const handleDispatch = async () => {
    setState('sending');

    if (API_BASE && selectedVolunteerId) {
      // --- Live API path ---
      try {
        const res = await fetch(`${API_BASE}/api/dispatches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentId: incident.id,
            volunteerId: selectedVolunteerId,
          }),
        });

        if (!res.ok) {
          setState('ready');
          return;
        }

        // Advance state machine with the same timing as the simulated flow
        setState('sent');
        await new Promise((r) => setTimeout(r, 1500));
        setState('confirmed');
        await new Promise((r) => setTimeout(r, 2000));
        setState('en_route');
      } catch {
        // Network error — revert to ready so coordinator can retry
        setState('ready');
      }
    } else {
      // --- Simulated fallback (no env var or no volunteer selected) ---
      await new Promise((r) => setTimeout(r, 1200));
      setState('sent');
      await new Promise((r) => setTimeout(r, 1500));
      setState('confirmed');
      await new Promise((r) => setTimeout(r, 2000));
      setState('en_route');
    }
  };

  const handleDispatchAll = async () => {
    setState('sending');
    await new Promise((r) => setTimeout(r, 1500));
    setState('sent');
    await new Promise((r) => setTimeout(r, 2000));
    setState('confirmed');
    await new Promise((r) => setTimeout(r, 2500));
    setState('en_route');
  };

  const steps: { key: DispatchState; label: string }[] = [
    { key: 'sent', label: 'SENT' },
    { key: 'confirmed', label: 'CONFIRMED' },
    { key: 'en_route', label: 'EN ROUTE' },
  ];

  const stepOrder: DispatchState[] = ['sent', 'confirmed', 'en_route'];

  const getStepState = (stepKey: DispatchState) => {
    const currentIdx = stepOrder.indexOf(state);
    const stepIdx = stepOrder.indexOf(stepKey);
    if (currentIdx >= stepIdx) return 'complete';
    if (currentIdx === stepIdx - 1) return 'active';
    return 'pending';
  };

  if (state !== 'ready' && state !== 'sending' && state !== 'error') {
    return (
      <div className="px-5 py-5">
        {/* Status tracker */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const stepState = getStepState(step.key);

            return (
              <div key={step.key} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-500 ${
                      stepState === 'complete'
                        ? 'bg-green/20 text-green border border-green/30 animate-dispatch-step'
                        : stepState === 'active'
                        ? 'bg-orange/20 text-orange border border-orange/30 animate-glow-pulse'
                        : 'bg-elevated text-muted/30 border border-border'
                    }`}
                  >
                    {stepState === 'complete' ? <Check size={12} /> : index + 1}
                  </div>
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider mt-1 ${
                      stepState === 'complete'
                        ? 'text-green'
                        : stepState === 'active'
                        ? 'text-orange'
                        : 'text-muted/30'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-1">
                    <ArrowRight
                      size={12}
                      className={`${
                        getStepState(steps[index + 1].key) !== 'pending'
                          ? 'text-green'
                          : 'text-muted/20'
                      } transition-colors duration-500`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {state === 'en_route' && (
          <div className="text-center p-3 bg-green/5 border border-green/20 rounded-lg">
            <p className="text-xs font-mono text-green uppercase tracking-wider">
              Help is on the way
            </p>
            <p className="text-[10px] font-mono text-muted mt-1">
              ETA: ~{Math.floor(Math.random() * 20 + 10)} minutes
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 py-5 space-y-3">
      {/* Primary dispatch button */}
      <button
        onClick={handleDispatch}
        disabled={state === 'sending'}
        className="w-full flex items-center justify-center gap-2 py-3 bg-orange hover:bg-orange/90 text-white font-mono text-xs uppercase tracking-wider rounded-lg transition-all hover:shadow-glow-orange disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === 'sending' ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send size={14} />
            Send Selected Help
          </>
        )}
      </button>

      {/* Secondary full-dispatch button */}
      <button
        onClick={handleDispatchAll}
        disabled={state === 'sending'}
        className="w-full flex items-center justify-center gap-2 py-3 border border-border text-muted font-mono text-xs uppercase tracking-wider rounded-lg transition-all hover:border-blue/50 hover:text-blue disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Users size={14} />
        Send All Helpers
      </button>
    </div>
  );
}
