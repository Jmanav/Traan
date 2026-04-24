'use client';

import { useDashboard } from '@/lib/context/DashboardContext';
import { useIncidents } from '@/lib/hooks/useIncidents';
import { SEVERITY } from '@/lib/severity';
import { Search, RefreshCw, AlertTriangle, MapPin, X } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';

export default function MapToolbar() {
  const { activeLayer, setActiveLayer, crisisMode, setCrisisMode, setSelectedIncident, panToCoordinates, searchQuery, setSearchQuery } = useDashboard();
  const { incidents } = useIncidents();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const layers = [
    { id: 'incidents' as const, label: 'Incidents' },
    { id: 'volunteers' as const, label: 'Volunteers' },
    { id: 'gaps' as const, label: 'Gaps' },
  ];

  // Filter incidents based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const q = searchQuery.toLowerCase().trim();
    return incidents.filter((inc) => {
      const sigId = `sig-${inc.id.split('_')[1]}`.toLowerCase();
      const fullId = inc.id.toLowerCase();
      const location = inc.locationRaw.toLowerCase();
      const needs = inc.needTypes.join(' ').toLowerCase();
      const tier = inc.tier.toLowerCase();
      const status = inc.status.toLowerCase();

      return (
        sigId.includes(q) ||
        fullId.includes(q) ||
        location.includes(q) ||
        needs.includes(q) ||
        tier.includes(q) ||
        status.includes(q)
      );
    }).slice(0, 6);
  }, [searchQuery, incidents]);

  const showDropdown = isSearchFocused && searchQuery.trim().length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (inc: typeof incidents[0]) => {
    setSelectedIncident(inc);
    panToCoordinates(inc.coordinates.lat, inc.coordinates.lng);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchRef.current?.focus();
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[500] flex items-center justify-between gap-3">
      {/* Left: Layer toggles */}
      <div className="flex items-center gap-1.5">
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-full transition-all ${
              activeLayer === layer.id
                ? 'bg-orange text-white shadow-glow-orange'
                : 'bg-surface/80 backdrop-blur-sm text-muted border border-border/50 hover:text-primary hover:border-orange/30'
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {/* Right: Search + Crisis Mode */}
      <div className="flex items-center gap-2">
        {/* Search with dropdown */}
        <div className="relative hidden md:block">
          <div className={`flex items-center gap-2 px-3 py-1.5 bg-surface/80 backdrop-blur-sm border rounded-full transition-all ${
            isSearchFocused ? 'border-orange/40 shadow-glow-orange' : 'border-border/50'
          }`}>
            <Search size={12} className={isSearchFocused ? 'text-orange' : 'text-muted'} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search grid..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="bg-transparent text-xs font-mono text-primary placeholder:text-muted/40 outline-none w-32"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="text-muted hover:text-primary transition-colors">
                <X size={10} />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full mt-2 right-0 w-[320px] bg-surface/97 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in"
            >
              {searchResults.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="px-3 py-2 border-b border-border/30">
                    <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                  {searchResults.map((inc) => {
                    const config = SEVERITY[inc.tier];
                    return (
                      <button
                        key={inc.id}
                        onClick={() => handleResultClick(inc)}
                        className="w-full text-left px-3 py-2.5 hover:bg-elevated/80 transition-colors border-b border-border/10 last:border-b-0"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-mono text-[11px] font-bold uppercase"
                              style={{ color: config.color }}
                            >
                              SIG-{inc.id.split('_')[1]}
                            </span>
                            <span
                              className="px-1.5 py-0.5 text-[8px] font-mono uppercase rounded"
                              style={{
                                color: config.color,
                                background: `${config.color}15`,
                                border: `1px solid ${config.color}25`,
                              }}
                            >
                              {config.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-data">
                            {inc.severityScore}/100
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={9} className="text-muted shrink-0" />
                          <span className="text-[10px] text-muted truncate">
                            {inc.locationRaw}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-6 text-center">
                  <span className="text-xs font-mono text-muted">
                    No matching grids for &quot;{searchQuery}&quot;
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/80 backdrop-blur-sm border border-border/50 rounded-full text-xs font-mono text-muted uppercase tracking-wider hover:text-primary hover:border-orange/30 transition-all">
          <RefreshCw size={12} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Crisis Mode */}
        <button
          onClick={() => setCrisisMode(!crisisMode)}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-full transition-all ${
            crisisMode
              ? 'bg-critical text-white shadow-glow-red animate-glow-pulse'
              : 'bg-surface/80 backdrop-blur-sm border border-border/50 text-muted hover:border-critical/50 hover:text-critical'
          }`}
        >
          <AlertTriangle size={12} />
          {crisisMode ? '● Emergency Mode' : 'Emergency Mode'}
        </button>
      </div>
    </div>
  );
}
