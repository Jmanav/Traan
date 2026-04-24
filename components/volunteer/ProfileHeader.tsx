'use client';

import { Volunteer } from '@/lib/types';
import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface ProfileHeaderProps {
  volunteer: Volunteer;
}

export default function ProfileHeader({ volunteer }: ProfileHeaderProps) {
  const [isAvailable, setIsAvailable] = useState(volunteer.isAvailable);
  const [showToast, setShowToast] = useState(false);

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const initials = volunteer.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="relative">
      {/* Name + role row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-space-grotesk text-2xl md:text-3xl font-bold text-primary uppercase">
            {volunteer.name}
          </h1>
          <p className="text-sm font-mono text-orange uppercase tracking-wider mt-1">
            {volunteer.skills[0]?.replace('_', ' ')} / Emergency Worker
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-border text-muted text-xs font-mono uppercase tracking-wider rounded hover:border-orange/30 hover:text-primary transition-all">
            <MessageSquare size={12} />
            Message Person
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange text-white text-xs font-mono uppercase tracking-wider rounded hover:shadow-glow-orange transition-all">
            <Send size={12} />
            Send to Help Now
          </button>
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
        {/* Avatar card */}
        <div className="card-tactical p-4 corner-marks">
          <div className="absolute top-2 right-3 text-[9px] font-mono text-muted/30 uppercase">
            ID: V-{volunteer.id.split('_')[1]}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-lg bg-elevated border border-border flex items-center justify-center text-2xl font-mono font-bold text-muted overflow-hidden">
              {volunteer.avatarUrl ? (
                <img src={volunteer.avatarUrl} alt={volunteer.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div className="space-y-2">
              {/* Availability toggle */}
              <button
                onClick={toggleAvailability}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all ${
                  isAvailable
                    ? 'bg-green/10 border border-green/30 text-green'
                    : 'bg-muted/10 border border-border text-muted'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green animate-availability-pulse' : 'bg-muted'}`} />
                {isAvailable ? 'Ready - Available' : 'Off Duty'}
              </button>

              {/* Quick stats */}
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">Clearance</span>
                  <span className="text-sm font-mono text-primary font-bold">LEVEL_04</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">Blood Type</span>
                  <span className="text-sm font-mono text-primary font-bold">O+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 toast-enter">
          <div className="bg-surface border border-green/30 rounded-lg px-4 py-3 shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green" />
            <span className="text-xs font-mono text-green uppercase">
              Status updated: {isAvailable ? 'Available' : 'Off Duty'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
