'use client';

import Link from 'next/link';
import { LayoutDashboard, Crosshair, Users, Radio, Shield } from 'lucide-react';
import CrisisStats from './CrisisStats';
import SignalFeed from './SignalFeed';
import SignalCounter from './SignalCounter';

export default function LeftPanel() {
  return (
    <div className="h-screen flex flex-col bg-surface border-r border-border overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border/50">
        <Link href="/" className="flex items-center gap-0.5">
          <span className="font-space-grotesk text-lg font-bold tracking-wider text-primary uppercase">
            TRAAN
          </span>
          <span className="w-2 h-2 rounded-sm bg-orange" />
        </Link>
      </div>

      {/* Team/Location */}
      <div className="px-5 py-3 border-b border-border/30 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange/10 border border-orange/20 flex items-center justify-center">
          <Shield size={14} className="text-orange" />
        </div>
        <div>
          <div className="text-xs font-mono text-muted uppercase">Team</div>
          <div className="text-sm font-space-grotesk font-semibold text-primary uppercase">Location</div>
        </div>
      </div>

      {/* Nav items */}
      <div className="px-3 py-2 border-b border-border/30 space-y-0.5">
        {[
          { icon: LayoutDashboard, label: 'Dashboard', active: false },
          { icon: Crosshair, label: 'Incidents', active: true },
          { icon: Users, label: 'Volunteers', active: false },
        ].map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all ${
              item.active
                ? 'bg-orange/10 text-orange border border-orange/20'
                : 'text-muted hover:text-primary hover:bg-elevated'
            }`}
          >
            <item.icon size={16} />
            <span className="uppercase tracking-wider text-xs">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Scrollable Center Area (Stats + Feed) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Crisis Stats */}
        <CrisisStats />

        {/* Signal Feed */}
        <SignalFeed />
      </div>

      {/* Signal Counter */}
      <SignalCounter />
    </div>
  );
}
