'use client';

import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import Link from 'next/link';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  return (
    <main className="min-h-screen bg-base flex flex-col relative">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-overlay opacity-10" />

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Auth card */}
          <div className="card-tactical corner-marks p-8 relative">
            {/* Node label */}
            <div className="absolute top-3 right-4 text-[10px] font-mono text-muted/30 uppercase">
              AUTH.NODE.01
            </div>

            {/* Logo */}
            <div className="text-center mb-6">
              <Link href="/" className="inline-flex items-center gap-0.5">
                <span className="font-space-grotesk text-2xl font-bold tracking-wider text-primary uppercase">
                  TRAAN
                </span>
                <span className="w-2.5 h-2.5 rounded-sm bg-orange mt-0.5" />
              </Link>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted mt-2">
                Restricted Access Terminal
              </p>
            </div>

            {/* Tab toggle */}
            <div className="flex border-b border-border mb-8">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 pb-3 text-sm font-mono uppercase tracking-wider transition-all ${
                  activeTab === 'login'
                    ? 'text-orange border-b-2 border-orange'
                    : 'text-muted hover:text-primary'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 pb-3 text-sm font-mono uppercase tracking-wider transition-all ${
                  activeTab === 'signup'
                    ? 'text-orange border-b-2 border-orange'
                    : 'text-muted hover:text-primary'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Forms */}
            {activeTab === 'login' ? <LoginForm /> : <SignupForm />}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs font-mono text-muted/40 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Traan Operations. All coordinates encrypted.
          </p>
          <div className="flex items-center gap-6">
            {['Protocols', 'Privacy', 'Terminal Support', 'Status'].map((link) => (
              <span key={link} className="text-xs font-mono text-muted/40 uppercase tracking-wider hover:text-orange transition-colors cursor-pointer">
                {link}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
