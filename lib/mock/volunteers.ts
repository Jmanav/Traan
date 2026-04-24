import { Volunteer, VolunteerMatch } from '@/lib/types';

export const MOCK_VOLUNTEERS: Volunteer[] = [
  {
    id: 'vol_001',
    name: 'Dr. Amit Patel',
    phone: '+919876543210',
    skills: ['medical', 'trauma_support', 'first_aid'],
    languages: ['HI', 'EN', 'GU'],
    coordinates: { lat: 19.9975, lng: 73.8005 },
    isAvailable: true,
    lastSeen: new Date(Date.now() - 2 * 60000).toISOString(),
    ngoId: 'ngo_alpha',
    dispatchCount: 47,
    avatarUrl: '',
  },
  {
    id: 'vol_002',
    name: 'Sunita Kambli',
    phone: '+919876543211',
    skills: ['flood_rescue', 'evacuation_coord', 'driving_4x4'],
    languages: ['MR', 'HI'],
    coordinates: { lat: 19.7100, lng: 73.5700 },
    isAvailable: true,
    lastSeen: new Date(Date.now() - 5 * 60000).toISOString(),
    ngoId: 'ngo_alpha',
    dispatchCount: 32,
    avatarUrl: '',
  },
  {
    id: 'vol_003',
    name: 'Vedanth Bagga',
    phone: '+919876543212',
    skills: ['flood_rescue', 'medical', 'navigation'],
    languages: ['HI', 'MR'],
    coordinates: { lat: 20.0150, lng: 73.8100 },
    isAvailable: true,
    lastSeen: new Date(Date.now() - 1 * 60000).toISOString(),
    ngoId: 'ngo_beta',
    dispatchCount: 23,
    avatarUrl: '',
  },
  {
    id: 'vol_004',
    name: 'Ajay Deshmukh',
    phone: '+919876543213',
    skills: ['evacuation_coord', 'logistics'],
    languages: ['MR'],
    coordinates: { lat: 19.2300, lng: 72.9900 },
    isAvailable: false,
    lastSeen: new Date(Date.now() - 30 * 60000).toISOString(),
    ngoId: 'ngo_beta',
    dispatchCount: 15,
    avatarUrl: '',
  },
  {
    id: 'vol_005',
    name: 'Priya Sharma',
    phone: '+919876543214',
    skills: ['medical', 'counseling', 'first_aid'],
    languages: ['HI', 'EN'],
    coordinates: { lat: 19.2500, lng: 73.1400 },
    isAvailable: true,
    lastSeen: new Date(Date.now() - 3 * 60000).toISOString(),
    ngoId: 'ngo_alpha',
    dispatchCount: 41,
    avatarUrl: '',
  },
  {
    id: 'vol_006',
    name: 'Sagar Rao',
    phone: '+919876543215',
    skills: ['driving_4x4', 'navigation', 'flood_rescue'],
    languages: ['MR', 'EN'],
    coordinates: { lat: 18.5300, lng: 73.1900 },
    isAvailable: true,
    lastSeen: new Date(Date.now() - 8 * 60000).toISOString(),
    ngoId: 'ngo_gamma',
    dispatchCount: 18,
    avatarUrl: '',
  },
  {
    id: 'vol_007',
    name: 'Manav Jain',
    phone: '+919876543216',
    skills: ['medical', 'counseling'],
    languages: ['MR', 'HI', 'EN'],
    coordinates: { lat: 16.7200, lng: 74.2500 },
    isAvailable: true,
    lastSeen: new Date(Date.now() - 4 * 60000).toISOString(),
    ngoId: 'ngo_gamma',
    dispatchCount: 29,
    avatarUrl: '',
  },
  {
    id: 'vol_008',
    name: 'Vikram Singh',
    phone: '+919876543217',
    skills: ['flood_rescue', 'evacuation_coord', 'driving_4x4', 'navigation'],
    languages: ['HI', 'EN'],
    coordinates: { lat: 19.7000, lng: 72.7800 },
    isAvailable: true,
    lastSeen: new Date(Date.now() - 6 * 60000).toISOString(),
    ngoId: 'ngo_beta',
    dispatchCount: 56,
    avatarUrl: '',
  },
];

export function getVolunteerMatches(incidentLat: number, incidentLng: number, needTypes: string[]): VolunteerMatch[] {
  return MOCK_VOLUNTEERS
    .filter((v) => v.isAvailable)
    .map((v) => {
      const dLat = v.coordinates.lat - incidentLat;
      const dLng = v.coordinates.lng - incidentLng;
      const distanceKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111 * 10) / 10;

      const skillMap: Record<string, string[]> = {
        rescue: ['flood_rescue', 'navigation'],
        medical: ['medical', 'first_aid', 'trauma_support'],
        evacuation: ['evacuation_coord', 'driving_4x4'],
        food: ['logistics'],
        shelter: ['logistics', 'evacuation_coord'],
        water: ['logistics'],
        hazmat: ['medical', 'first_aid'],
      };

      const relevantSkills = needTypes.flatMap((n) => skillMap[n] || []);
      const matchedSkills = v.skills.filter((s) => relevantSkills.includes(s));
      const skillMatchScore = relevantSkills.length > 0
        ? Math.min(100, Math.round((matchedSkills.length / relevantSkills.length) * 100))
        : 50;

      return { volunteer: v, distanceKm, skillMatchScore };
    })
    .sort((a, b) => {
      const scoreA = a.skillMatchScore * 0.6 + (100 - Math.min(a.distanceKm, 100)) * 0.4;
      const scoreB = b.skillMatchScore * 0.6 + (100 - Math.min(b.distanceKm, 100)) * 0.4;
      return scoreB - scoreA;
    })
    .slice(0, 5);
}
