'use client';

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { Incident } from '@/lib/types';

interface DashboardState {
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;
  activeLayer: 'incidents' | 'volunteers' | 'gaps';
  setActiveLayer: (layer: 'incidents' | 'volunteers' | 'gaps') => void;
  crisisMode: boolean;
  setCrisisMode: (active: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  panToCoordinates: (lat: number, lng: number) => void;
  registerMapPan: (fn: (lat: number, lng: number) => void) => void;
  selectedVolunteerId: string | null;
  setSelectedVolunteerId: (id: string | null) => void;
}

const DashboardContext = createContext<DashboardState | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeLayer, setActiveLayer] = useState<'incidents' | 'volunteers' | 'gaps'>('incidents');
  const [crisisMode, setCrisisMode] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const mapPanRef = useRef<((lat: number, lng: number) => void) | null>(null);

  const panToCoordinates = useCallback((lat: number, lng: number) => {
    if (mapPanRef.current) {
      mapPanRef.current(lat, lng);
    }
  }, []);

  const registerMapPan = useCallback((fn: (lat: number, lng: number) => void) => {
    mapPanRef.current = fn;
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        selectedIncident,
        setSelectedIncident,
        activeLayer,
        setActiveLayer,
        crisisMode,
        setCrisisMode,
        isMobileMenuOpen,
        setMobileMenuOpen,
        searchQuery,
        setSearchQuery,
        panToCoordinates,
        registerMapPan,
        selectedVolunteerId,
        setSelectedVolunteerId
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
