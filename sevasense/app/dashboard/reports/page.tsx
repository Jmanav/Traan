import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports — Traan',
  description: 'Post-crisis analysis and report viewer',
};

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-elevated/50 border border-border flex items-center justify-center mx-auto">
          <span className="text-2xl">📊</span>
        </div>
        <h1 className="font-space-grotesk text-2xl font-bold text-primary">
          Report Viewer
        </h1>
        <p className="text-muted font-mono text-sm max-w-md">
          Post-crisis reports will appear here once incidents are resolved. Analysis includes response times, volunteer effectiveness, and resource utilization.
        </p>
      </div>
    </div>
  );
}
