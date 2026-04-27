'use client';

import { useEffect, useState, useRef } from 'react';

const STATS = [
  { value: 3.3, suffix: 'M', label: 'NGOs in India', decimals: 1 },
  { value: 40, suffix: '+', label: 'Floods annually', decimals: 0 },
  { value: 6, suffix: 'hr', label: 'Critical window', decimals: 0, prefix: '0–' },
  { value: 70, suffix: '%', label: 'Field data never digitized', decimals: 0 },
];

function AnimatedCounter({ value, suffix, decimals, prefix }: { value: number; suffix: string; decimals: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 1500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Number((eased * value).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, value, decimals]);

  return (
    <div ref={ref} className="text-center">
      <div className="metric-xl text-orange mb-2">
        {prefix}{displayValue.toFixed(decimals)}{suffix}
      </div>
      <div className="text-xs font-mono text-muted uppercase tracking-wider">
        {STATS.find(s => s.value === value)?.label}
      </div>
    </div>
  );
}

export default function ImpactStats() {
  return (
    <section className="relative py-24 bg-[#0d1320]">
      <div className="absolute inset-0 bg-grid-overlay opacity-5" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {STATS.map((stat) => (
            <AnimatedCounter key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
