'use client';

import LeftPanel from '@/components/dashboard/LeftPanel';
import CenterPanel from '@/components/dashboard/CenterPanel';
import RightPanel from '@/components/dashboard/RightPanel';

export default function DashboardPage() {
  return (
    <div className="h-screen w-screen overflow-hidden grid grid-cols-1 xl:grid-cols-[280px_1fr_340px] bg-base dashboard-grid">
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
    </div>
  );
}
