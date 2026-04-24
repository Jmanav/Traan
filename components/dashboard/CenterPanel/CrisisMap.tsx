'use client';

import dynamic from 'next/dynamic';

const GoogleCrisisMap = dynamic(() => import('./GoogleCrisisMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#070b14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-orange/30 border-t-orange rounded-full animate-spin" />
        <span className="text-xs font-mono text-muted uppercase tracking-wider">
          Initializing map...
        </span>
      </div>
    </div>
  ),
});

export default function CrisisMap() {
  return <GoogleCrisisMap />;
}
