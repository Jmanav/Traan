import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        border: 'var(--border)',
        orange: 'var(--accent-orange)',
        blue: 'var(--accent-blue)',
        green: 'var(--accent-green)',
        critical: 'var(--critical)',
        urgent: 'var(--urgent)',
        moderate: 'var(--moderate)',
        primary: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        data: 'var(--text-data)',
      },
      fontFamily: {
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        'space-grotesk': ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      keyframes: {
        'signal-enter': {
          '0%': { transform: 'translateY(-8px)', background: 'rgba(249,115,22,0.15)' },
          '100%': { transform: 'translateY(0)', background: 'transparent' },
        },
        'crisis-pulse': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '70%': { transform: 'scale(2)', opacity: '0' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        'counter-flash': {
          '0%': { color: 'var(--accent-orange)', textShadow: '0 0 12px var(--accent-orange)' },
          '100%': { color: 'var(--text-data)', textShadow: 'none' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(249,115,22,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(249,115,22,0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'availability-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.4)', opacity: '0.5' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'heatmap-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'dispatch-step': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'signal-enter': 'signal-enter 0.5s ease-out',
        'crisis-pulse': 'crisis-pulse 2s ease-out infinite',
        breathe: 'breathe 3s ease-in-out infinite',
        'counter-flash': 'counter-flash 0.8s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'availability-pulse': 'availability-pulse 2s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'heatmap-glow': 'heatmap-glow 2s ease-in-out infinite',
        'dispatch-step': 'dispatch-step 0.4s ease-out',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(31,41,55,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(31,41,55,0.3) 1px, transparent 1px)',
        'radial-hero': 'radial-gradient(ellipse at 50% 50%, #0f1829 0%, #0A0E1A 70%)',
        'radial-glow-orange': 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
        'radial-glow-red': 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid-sm': '24px 24px',
        'grid-md': '48px 48px',
      },
      boxShadow: {
        'glow-orange': '0 0 12px rgba(249,115,22,0.4)',
        'glow-red': '0 0 12px rgba(239,68,68,0.4)',
        'glow-blue': '0 0 12px rgba(59,130,246,0.4)',
        'glow-green': '0 0 12px rgba(16,185,129,0.4)',
        'inner-border': 'inset 0 0 0 1px rgba(31,41,55,0.5)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
