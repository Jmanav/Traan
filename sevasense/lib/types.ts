export type SignalType = 'audio' | 'image' | 'text';
export type SeverityTier = 'critical' | 'urgent' | 'moderate';
export type IncidentStatus = 'active' | 'dispatched' | 'resolved';
export type DispatchStatus = 'sent' | 'confirmed' | 'en_route' | 'arrived';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  locationRaw: string;
  coordinates: Coordinates;
  severityScore: number;
  tier: SeverityTier;
  needTypes: string[];
  vulnerableGroups: string[];
  affectedCount: number;
  accessConstraints: string;
  status: IncidentStatus;
  signalCount: number;
  confidence: number;
  signalType: SignalType;
  languageDetected: string;
  createdAt: string;
  updatedAt: string;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  skills: string[];
  languages: string[];
  coordinates: Coordinates;
  isAvailable: boolean;
  lastSeen: string;
  ngoId: string;
  dispatchCount: number;
  avatarUrl?: string;
}

export interface VolunteerMatch {
  volunteer: Volunteer;
  distanceKm: number;
  skillMatchScore: number;
}

export interface Dispatch {
  id: string;
  incidentId: string;
  volunteerId: string;
  status: DispatchStatus;
  dispatchedAt: string;
  confirmedAt?: string;
  estimatedEta?: number;
}

export interface Signal {
  id: string;
  incidentId?: string;
  signalType: SignalType;
  rawText?: string;
  extractedJson?: Partial<Incident>;
  receivedAt: string;
  telegramMessageId?: string;
}
