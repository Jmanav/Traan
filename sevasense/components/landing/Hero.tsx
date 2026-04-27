'use client';

import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col bg-base overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-overlay opacity-30" />
      
      {/* Radial gradient */}
      <div className="absolute inset-0 bg-radial-hero" />

      {/* Subtle scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange/20 to-transparent animate-scan-line" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-border/50">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-0.5">
            <span className="font-space-grotesk text-xl font-bold tracking-wider text-primary uppercase">
              TRAAN
            </span>
            <span className="w-2 h-2 rounded-sm bg-orange mt-1" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {['Operations', 'Resources', 'Network', 'Intelligence'].map((item, i) => (
              <button
                key={item}
                className={`text-sm font-mono uppercase tracking-wider transition-colors ${
                  i === 0 ? 'text-orange border-b border-orange pb-0.5' : 'text-muted hover:text-primary'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-wider text-muted border border-border rounded hover:border-orange/50 hover:text-primary transition-all"
          >
            Access Terminal
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-wider bg-orange text-white rounded hover:shadow-glow-orange transition-all"
          >
            <ArrowRight size={14} />
            Deploy
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="space-y-8">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-orange/30 bg-orange/5">
              <span className="w-2 h-2 rounded-full bg-orange animate-availability-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-orange">
                System Online
              </span>
            </div>

            {/* Main heading */}
            <div>
              <h1 className="font-space-grotesk text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
                <span className="text-primary">COORDINATE HELP</span>
                <br />
                <span className="text-orange">WHERE IT&apos;S NEEDED</span>
                <br />
                <span className="text-orange">MOST.</span>
              </h1>
            </div>

            {/* Subheading */}
            <p className="text-lg text-muted max-w-xl leading-relaxed font-inter">
              Connecting volunteers and resources during local emergencies with real-time data and simple tools. No forms. No app downloads. No delay.
            </p>

            {/* CTA buttons */}
            <div className="flex items-center gap-4">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-orange text-white font-space-grotesk font-semibold uppercase tracking-wider rounded hover:shadow-glow-orange hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Join the Mission
                <ArrowRight size={16} />
              </Link>
              <button className="inline-flex items-center gap-2 px-6 py-3.5 border border-border text-primary font-space-grotesk font-semibold uppercase tracking-wider rounded hover:border-orange/50 hover:text-orange transition-all active:scale-[0.98]">
                <Play size={14} />
                See It in Action
              </button>
            </div>

            {/* Bottom stats */}
            <div className="flex items-center gap-3 text-xs font-mono text-muted flex-wrap">
              <span className="pill-outlined">0–6 Hour Coverage Window</span>
              <span className="text-border">·</span>
              <span className="pill-outlined">125+ Languages Supported</span>
              <span className="text-border">·</span>
              <span className="pill-outlined">Zero Form-Filling Required</span>
            </div>
          </div>

          {/* Right: Globe/Map Visual */}
          <div className="hidden lg:flex items-center justify-center relative">
            <div className="relative w-[500px] h-[500px]">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full border border-border/30 animate-crisis-pulse" />
              <div className="absolute inset-4 rounded-full border border-border/20" />
              <div className="absolute inset-8 rounded-full border border-border/10" />
              
              {/* Center circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-elevated to-surface border border-border/50 flex items-center justify-center relative overflow-hidden">
                  {/* Grid overlay on globe */}
                  <div className="absolute inset-0 bg-grid-overlay opacity-20" />
                  
                  {/* Simulated map dots */}
                  <div className="relative">
                    {[
                      { top: '20%', left: '60%', color: '#EF4444', size: 6 },
                      { top: '35%', left: '65%', color: '#F97316', size: 5 },
                      { top: '45%', left: '55%', color: '#EF4444', size: 7 },
                      { top: '55%', left: '70%', color: '#EAB308', size: 4 },
                      { top: '40%', left: '45%', color: '#F97316', size: 5 },
                      { top: '60%', left: '50%', color: '#10B981', size: 4 },
                    ].map((dot, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                          top: dot.top,
                          left: dot.left,
                          width: dot.size,
                          height: dot.size,
                          backgroundColor: dot.color,
                          boxShadow: `0 0 ${dot.size * 2}px ${dot.color}80`,
                          animation: `availability-pulse 2s ease-in-out ${i * 0.3}s infinite`,
                        }}
                      />
                    ))}
                  </div>

                  {/* India outline hint with SVG-style lines */}
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-20">
                    <path
                      d="M45,15 L55,12 L65,20 L70,30 L72,45 L68,55 L65,65 L58,75 L50,80 L45,75 L40,65 L38,55 L35,45 L38,30 Z"
                      fill="none"
                      stroke="var(--accent-orange)"
                      strokeWidth="0.5"
                    />
                  </svg>
                </div>
              </div>

              {/* Floating coordinate labels */}
              <div className="absolute top-1/4 right-0 text-xs font-mono text-data/60 bg-surface/80 px-2 py-1 rounded border border-border/30 backdrop-blur-sm">
                19.0760° N
              </div>
              <div className="absolute bottom-1/3 left-0 text-xs font-mono text-data/60 bg-surface/80 px-2 py-1 rounded border border-border/30 backdrop-blur-sm">
                72.8777° E
              </div>

              {/* Floating label */}
              <div className="absolute bottom-16 right-8 flex items-center gap-2 bg-surface/80 backdrop-blur-sm px-3 py-1.5 rounded border border-border/30">
                <span className="w-1.5 h-1.5 rounded-full bg-orange animate-availability-pulse" />
                <span className="text-xs font-mono text-muted">Synced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
