import { Volunteer } from '@/lib/types';
import { Droplets, Stethoscope, Truck, Navigation, Shield, Heart, Languages } from 'lucide-react';

interface SkillBadgesProps {
  volunteer: Volunteer;
}

const SKILL_CONFIG: Record<string, { icon: typeof Droplets; label: string }> = {
  flood_rescue: { icon: Droplets, label: 'Flood Rescue' },
  medical: { icon: Stethoscope, label: 'Advanced Trauma Support' },
  first_aid: { icon: Heart, label: 'First Aid' },
  trauma_support: { icon: Stethoscope, label: 'Trauma Support' },
  evacuation_coord: { icon: Shield, label: 'Evacuation Coordination' },
  driving_4x4: { icon: Truck, label: '4x4 Driving / Evac' },
  navigation: { icon: Navigation, label: 'Navigation' },
  logistics: { icon: Truck, label: 'Logistics' },
  counseling: { icon: Heart, label: 'Counseling' },
};

const LANG_MAP: Record<string, string> = {
  HI: 'Hindi (Native)',
  MR: 'Marathi (Fluent)',
  EN: 'English (Fluent)',
  GU: 'Gujarati (Conversational)',
};

export default function SkillBadges({ volunteer }: SkillBadgesProps) {
  // Trust score (simulated)
  const trustScore = 90 + Math.floor(Math.random() * 10);

  return (
    <div className="space-y-6">
      {/* Trust Score */}
      <div className="card-tactical p-4 corner-marks">
        <div className="absolute top-2 right-3 text-[9px] font-mono text-muted/30 uppercase">METRIC_01</div>
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-3">Trust Score</div>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-mono font-bold text-green">
            {trustScore}<span className="text-lg text-muted">%</span>
          </span>
          {/* Score bar segments */}
          <div className="flex gap-1 flex-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-6 flex-1 rounded-sm"
                style={{
                  backgroundColor: i < Math.ceil(trustScore / 20) 
                    ? `rgba(16, 185, 129, ${0.3 + i * 0.15})` 
                    : 'var(--bg-elevated)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="card-tactical p-4 corner-marks">
        <div className="absolute top-2 right-3 text-[9px] font-mono text-muted/30 uppercase">DATA_SET_B</div>
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-3">Skills</div>
        <div className="space-y-2.5">
          {volunteer.skills.map((skill) => {
            const config = SKILL_CONFIG[skill];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <div key={skill} className="flex items-center gap-2">
                <Icon size={14} className="text-orange" />
                <span className="text-sm text-primary">{config.label}</span>
              </div>
            );
          })}

          {/* Languages */}
          <div className="pt-2 mt-2 border-t border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Languages size={14} className="text-orange" />
              <span className="text-sm text-primary">
                {volunteer.languages.map(l => LANG_MAP[l] || l).join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tools & Gear */}
      <div className="card-tactical p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-3">Tools & Gear</div>
        <div className="flex flex-wrap gap-2">
          {['Level 3 Med-Kit', 'Sat-Phone', 'High-Vis Gear'].map((tool) => (
            <span key={tool} className="px-2.5 py-1 text-xs font-mono text-primary border border-border rounded bg-elevated/30">
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
