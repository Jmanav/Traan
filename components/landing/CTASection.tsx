import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="relative py-24 bg-base border-t border-border/30">
      <div className="absolute inset-0 bg-radial-glow-orange opacity-30" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center space-y-8">
        <h2 className="font-space-grotesk text-3xl md:text-4xl font-bold text-primary">
          Built for coordinators who can&apos;t afford to wait.
        </h2>
        <p className="text-muted text-lg">
          Every second matters. Traan gives your team the tactical advantage in the critical 0-6 hour window.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 px-8 py-4 bg-orange text-white font-space-grotesk font-bold uppercase tracking-wider rounded hover:shadow-glow-orange hover:brightness-110 transition-all text-lg"
        >
          Request Access
        </Link>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-24 border-t border-border/30 pt-6 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-muted/50 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Traan Operations. All coordinates encrypted.
          </p>
          <div className="flex items-center gap-6">
            {['Protocols', 'Privacy', 'Terminal Support'].map((link) => (
              <span key={link} className="text-xs font-mono text-muted/40 uppercase tracking-wider hover:text-orange transition-colors cursor-pointer">
                {link}
              </span>
            ))}
            <span className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-orange animate-availability-pulse" />
              <span className="text-orange">Status</span>
            </span>
          </div>
        </div>
      </footer>
    </section>
  );
}