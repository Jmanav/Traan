'use client';

import { useSignalCounter } from '@/lib/hooks/useSignalCounter';
import { Radio, Wifi } from 'lucide-react';

export default function SignalCounter() {
  const { formattedCount, isFlashing } = useSignalCounter();

  return (
    <div className="px-5 py-3 border-t border-border/30 bg-base/50">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-1">
        Total Reports
      </div>
      <div
        className={`text-xl font-mono font-bold transition-all duration-300 ${
          isFlashing ? 'text-orange' : 'text-orange/80'
        }`}
        style={{
          textShadow: isFlashing ? '0 0 12px rgba(249,115,22,0.5)' : 'none',
        }}
      >
        {formattedCount}
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted">
          <Radio size={10} />
          <span>SIGNAL_STRENGTH</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-green">
          <Wifi size={10} />
          <span>UPTIME_99.9%</span>
        </div>
      </div>
    </div>
  );
}
