'use client';

import { use } from 'react';
import { MOCK_VOLUNTEERS } from '@/lib/mock/volunteers';
import ProfileHeader from '@/components/volunteer/ProfileHeader';
import SkillBadges from '@/components/volunteer/SkillBadges';
import DispatchHistory from '@/components/volunteer/DispatchHistory';
import Link from 'next/link';
import { LayoutDashboard, Crosshair, Users, ClipboardList, Package, MessageSquare, Shield, Plus, AtSign, Bell, Settings } from 'lucide-react';

export default function VolunteerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const volunteer = MOCK_VOLUNTEERS.find((v) => v.id === id) || MOCK_VOLUNTEERS[0];

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: false },
    { icon: Users, label: 'Volunteers', active: true },
    { icon: ClipboardList, label: 'Tasks', active: false },
    { icon: Package, label: 'Supplies', active: false },
    { icon: MessageSquare, label: 'Messages', active: false },
  ];

  return (
    <div className="min-h-screen bg-base flex">
      {/* Sidebar */}
      <div className="hidden lg:flex w-[220px] flex-col bg-surface border-r border-border">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-border/50">
          <Link href="/" className="flex items-center gap-0.5">
            <span className="font-space-grotesk text-base font-bold tracking-wider text-orange uppercase">
              CRISIS_CORE
            </span>
            <span className="text-[10px] font-mono text-muted ml-1">V1.0</span>
          </Link>
        </div>

        {/* Team */}
        <div className="px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange/10 border border-orange/20 flex items-center justify-center">
              <Shield size={14} className="text-orange" />
            </div>
            <div>
              <div className="text-xs font-space-grotesk font-semibold text-orange uppercase">Alpha Team</div>
              <div className="text-[10px] font-mono text-green uppercase">System Ready</div>
            </div>
          </div>
        </div>

        {/* New Task */}
        <div className="px-4 py-3">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange text-white text-xs font-mono uppercase tracking-wider rounded-lg hover:shadow-glow-orange transition-all">
            New Task
          </button>
        </div>

        {/* Nav */}
        <div className="px-3 space-y-0.5 flex-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                item.active
                  ? 'bg-orange/10 text-orange'
                  : 'text-muted hover:text-primary hover:bg-elevated'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-surface/50 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted uppercase">Volunteer Info</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-full bg-elevated border border-border flex items-center justify-center text-muted hover:text-primary transition-colors">
              <AtSign size={14} />
            </button>
            <button className="w-8 h-8 rounded-full bg-elevated border border-border flex items-center justify-center text-muted hover:text-primary transition-colors">
              <Bell size={14} />
            </button>
            <button className="w-8 h-8 rounded-full bg-elevated border border-border flex items-center justify-center text-muted hover:text-primary transition-colors">
              <Settings size={14} />
            </button>
            <div className="w-8 h-8 rounded-full bg-blue/20 border border-blue/30 flex items-center justify-center text-xs font-mono text-blue font-bold">
              AP
            </div>
          </div>
        </div>

        {/* Profile content */}
        <div className="px-6 py-6">
          <ProfileHeader volunteer={volunteer} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6 mt-6">
            {/* Left column */}
            <div className="space-y-6">
              <SkillBadges volunteer={volunteer} />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Map card */}
              <div className="card-tactical p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
                  <span className="text-xs font-mono text-primary uppercase">{volunteer.name.split(' ').pop()}&apos;s Sector</span>
                  <span className="text-[10px] font-mono text-data">
                    POS: {volunteer.coordinates.lat.toFixed(4)}° N, {volunteer.coordinates.lng.toFixed(4)}° W
                  </span>
                </div>
                <div className="h-48 bg-[#070b14] relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-overlay opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border border-green/20 animate-crisis-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-green/30 border border-green/50 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-green" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Past Work stats */}
              <div className="card-tactical p-4 corner-marks">
                <div className="absolute top-2 right-3 text-[9px] font-mono text-muted/30 uppercase">STAT_LOG</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-3">Past Work</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-mono text-muted uppercase mb-1">Completed</div>
                    <div className="text-3xl font-mono font-bold text-primary">{volunteer.dispatchCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-orange uppercase mb-1">Active</div>
                    <div className="text-3xl font-mono font-bold text-orange">02</div>
                  </div>
                </div>
              </div>

              {/* Dispatch History */}
              <DispatchHistory volunteer={volunteer} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
