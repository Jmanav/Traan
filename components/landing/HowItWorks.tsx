'use client';

import { Mic, Cpu, MapPin, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    number: 'OBJ-01',
    title: 'REAL-TIME MAP',
    description: 'Visualize incidents and volunteer locations with absolute tactical precision. Eliminate fog of war.',
    icon: Mic,
    detail: 'Field worker sends voice note in Hindi on Telegram',
  },
  {
    number: 'OBJ-02',
    title: 'SMART MATCHING',
    description: 'Match the right help with the right problem instantly. Algorithmic deployment.',
    icon: Cpu,
    detail: 'Gemini AI extracts: location, needs, severity, affected count',
  },
  {
    number: 'OBJ-03',
    title: 'EASY COMMUNICATION',
    description: 'Keep everyone connected without the tech jargon. A streamlined terminal interface for field operatives and command center personnel alike.',
    icon: MapPin,
    detail: 'Crisis pin appears on coordinator dashboard. Volunteer dispatched.',
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-24 bg-base">
      <div className="absolute inset-0 bg-grid-overlay opacity-10" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <div className="mb-16">
          <h2 className="font-space-grotesk text-3xl md:text-4xl font-bold text-primary mb-4">
            From chaos to coordinated<br />in under 60 seconds.
          </h2>
          <p className="text-muted text-lg max-w-xl">
            Three stages. One objective. Zero wasted time.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {STEPS.map((step, index) => (
            <div key={step.number} className="group relative">
              {/* Connection line (between cards) */}
              {index < STEPS.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 z-10 text-border">
                  <ArrowRight size={20} className="text-orange/30" />
                </div>
              )}
              
              <div className="card-tactical corner-marks p-6 h-full hover-glow transition-all duration-300 group-hover:border-orange/30">
                {/* Header row */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-space-grotesk text-lg font-bold text-primary uppercase tracking-wide">
                    {step.title}
                  </h3>
                  <span className="text-xs font-mono text-muted/40 uppercase">
                    {step.number}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Visual area */}
                <div className="bg-base/50 border border-border/30 rounded-lg p-4 min-h-[120px] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-overlay opacity-10" />
                  
                  {index === 0 && (
                    <div className="relative flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-orange/50 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-orange animate-availability-pulse" />
                      </div>
                      <span className="text-xs font-mono text-orange/60 uppercase">INCIDENT_ALPHA</span>
                    </div>
                  )}

                  {index === 1 && (
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-muted uppercase">Resource Request</span>
                        <span className="text-critical font-bold">CRITICAL</span>
                      </div>
                      <div className="border-t border-border/30" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-green/20 flex items-center justify-center text-green text-xs">+</span>
                          <span className="text-sm text-primary font-mono">Med-Kit A</span>
                        </div>
                        <ArrowRight size={14} className="text-muted" />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-primary font-mono">Unit 04</span>
                        </div>
                      </div>
                      <div className="w-full h-1 rounded-full bg-border overflow-hidden">
                        <div className="h-full bg-green rounded-full" style={{ width: '100%' }} />
                      </div>
                      <div className="text-right text-xs font-mono text-green">MATCH 100%</div>
                    </div>
                  )}

                  {index === 2 && (
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-critical" />
                          <span className="w-2 h-2 rounded-full bg-orange" />
                          <span className="w-2 h-2 rounded-full bg-green" />
                        </div>
                        <span className="text-xs font-mono text-muted">TERMINAL_RELAY_v2.4</span>
                      </div>
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="text-muted">&gt; Establishing secure handshake...</div>
                        <div className="text-muted">&gt; Node connection verified [10.4.22.1]</div>
                        <div className="text-muted">&gt; [CMD_CTRL] to [FIELD_OP_7]: Status update requested.</div>
                        <div className="text-green">&gt; [FIELD_OP_7]: Clear. Proceeding to rally point beta.</div>
                        <div className="text-muted animate-breathe">_ |</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
