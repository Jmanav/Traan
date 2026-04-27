'use client';

import CrisisMap from './CrisisMap';
import MapToolbar from './MapToolbar';

export default function CenterPanel() {
  return (
    <div className="relative h-screen overflow-hidden bg-base">
      {/* Map fills entire panel */}
      <CrisisMap />
      
      {/* Toolbar overlay */}
      <MapToolbar />

      {/* Bottom coordinate display */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 z-[400]">
        <span className="text-[10px] font-mono text-data/50">
          LAT: 19° 56&apos; 17.5&quot; N
        </span>
        <span className="text-[10px] font-mono text-data/50">
          LON: 72° 49&apos; 44.5&quot; E
        </span>
        <span className="text-[10px] font-mono text-data/50">
          ALT: 14M MSL
        </span>
      </div>

      {/* Edge vignette */}
      <div className="absolute inset-0 pointer-events-none map-dark-overlay z-[2]" />
    </div>
  );
}
