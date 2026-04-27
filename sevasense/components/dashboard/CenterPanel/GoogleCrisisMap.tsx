'use client';

import { useDashboard } from '@/lib/context/DashboardContext';
import { useIncidents } from '@/lib/hooks/useIncidents';
import { useVolunteers } from '@/lib/hooks/useVolunteers';
import { SEVERITY } from '@/lib/severity';
import { useEffect, useRef, useCallback, useState } from 'react';
import { Incident } from '@/lib/types';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

// Dark tactical map style for Google Maps (Lightened for better visibility)
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#131826' }] }, // Lighter landmass
  { elementType: 'labels.text.stroke', stylers: [{ color: '#131826' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] }, // Brighter text
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2d3748' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4a5568' }, { weight: 1.5 }] }, // Distinct country borders
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#2d3748' }, { weight: 1.0 }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2d3748' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#28354c' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#374151' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a2336' }] }, // More distinct blue-gray water
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2d3748' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#151d2e' }] },
];

export default function GoogleCrisisMap() {
  const { selectedIncident, setSelectedIncident, activeLayer, registerMapPan, selectedVolunteerId } = useDashboard();
  const { incidents } = useIncidents();
  const { volunteers } = useVolunteers();
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<google.maps.OverlayView[]>([]);
  const gapCirclesRef = useRef<google.maps.Circle[]>([]);
  
  // Storage for Deck.gl Overlay
  const deckOverlayRef = useRef<GoogleMapsOverlay | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [mapReady, setMapReady] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');

  // Safely load script using callback to prevent "Map is not a constructor" race conditions
  useEffect(() => {
    const apiKey = (process as any).env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (window.google?.maps?.Map) {
      setMapsLoaded(true);
      return;
    }

    if (!apiKey) {
      console.warn('Google Maps API key not set. Map will use fallback.');
      setMapsLoaded(true);
      return;
    }

    // Bind callback to window for async script loading
    if (!(window as any).initSevaSenseMaps) {
      (window as any).initSevaSenseMaps = () => {
        setMapsLoaded(true);
      };
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) return;

    // Notice we've completely dropped libraries=visualization to kill deprecated warnings!
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&callback=initSevaSenseMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('Failed to load Google Maps');
      setMapsLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current || mapRef.current) return;
    if (!window.google?.maps?.Map) return; // Fallback handles this later if missing

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: 19.5, lng: 73.5 },
      zoom: 8,
      styles: DARK_MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      backgroundColor: '#0a0e1a',
      minZoom: 6,
      maxZoom: 18,
      // No MapID provided. This perfectly satisfies Deck.gl and enables our custom styling!
    });

    infoWindowRef.current = new google.maps.InfoWindow();
    mapRef.current = map;
    setMapReady(true);
  }, [mapsLoaded]);

  // Register Map Pan Hook
  useEffect(() => {
    registerMapPan((lat: number, lng: number) => {
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(13);
      }
    });
  }, [registerMapPan]);

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];
    gapCirclesRef.current.forEach(c => c.setMap(null));
    gapCirclesRef.current = [];
  }, []);

  // Helper factory to create OverlayView class for our tactical HTML SVG Pins
  const createOverlayClass = useCallback(() => {
    if (!window.google?.maps?.OverlayView) return null;

    return class CustomDOMOverlay extends google.maps.OverlayView {
      position: google.maps.LatLng;
      element: HTMLElement;
      
      constructor(position: google.maps.LatLng, element: HTMLElement) {
        super();
        this.position = position;
        this.element = element;
      }
      onAdd() {
        this.getPanes()?.overlayMouseTarget.appendChild(this.element);
      }
      draw() {
        const projection = this.getProjection();
        if (!projection) return;
        const pos = projection.fromLatLngToDivPixel(this.position);
        if (pos) {
          this.element.style.position = 'absolute';
          this.element.style.left = `${pos.x}px`;
          this.element.style.top = `${pos.y}px`;
        }
      }
      onRemove() {
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
      }
      getPosition() { return this.position; }
    };
  }, []);

  // Render Overlays (Incidents, Deck.gl Heatmap, Volunteers)
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google?.maps) return;

    clearOverlays();
    
    // Initialize deck.gl overlay strictly once
    if (!deckOverlayRef.current) {
      deckOverlayRef.current = new GoogleMapsOverlay({ layers: [] });
      deckOverlayRef.current.setMap(mapRef.current);
    }

    const map = mapRef.current;
    const OverlayClass = createOverlayClass();
    if (!OverlayClass) return;

    const deckLayers: any[] = [];

    // --- Render Incidents & GPU Heatmaps ---
    if (activeLayer === 'incidents' || activeLayer === 'gaps') {
      
      // DECK.GL GPU Heatmap Layer
      const heatmapData = activeIncidents.map((incident) => ({
        coordinates: [incident.coordinates.lng, incident.coordinates.lat],
        weight: incident.severityScore
      }));

      const gpuHeatmapLayer = new HeatmapLayer({
        id: 'deck-crisis-heatmap',
        data: heatmapData,
        getPosition: (d: any) => d.coordinates,
        getWeight: (d: any) => d.weight,
        radiusPixels: 90, // Massive organic blur
        intensity: 1.2,
        threshold: 0.03, // Eliminates hard dark edges
        colorRange: [
          [30, 64, 175],   // Deep Blue
          [16, 185, 129],  // Emerald
          [132, 204, 22],  // Lime
          [234, 179, 8],   // Yellow
          [249, 115, 22],  // Orange
          [239, 68, 68],   // Red
          [185, 28, 28]    // Dark Red
        ]
      });

      deckLayers.push(gpuHeatmapLayer);

      // Render Tactical DOM Pins
      activeIncidents.forEach((incident) => {
        const config = SEVERITY[incident.tier];
        const isSelected = selectedIncident?.id === incident.id;
        const isCritical = incident.tier === 'critical';
        const size = isSelected ? 24 : 16;

        const container = document.createElement('div');
        container.style.cssText = 'position:absolute; transform:translate(-50%, -50%); cursor:pointer; display:flex; align-items:center; justify-content:center;';

        // Critical Pulse Ring
        if (isCritical) {
          const pulse = document.createElement('div');
          pulse.style.cssText = `
            position:absolute;width:40px;height:40px;
            top:50%;left:50%;transform:translate(-50%,-50%);
            border-radius:50%;border:2px solid ${config.color};opacity:0.6;
            animation:crisis-pulse 1.5s ease-out infinite;pointer-events:none;
          `;
          container.appendChild(pulse);
        }

        // Tactical SVG Pin
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', String(size));
        svg.setAttribute('height', String(size));
        svg.setAttribute('viewBox', '0 0 16 16');
        svg.style.cssText = `transition:transform 0.2s;position:relative;z-index:2;${isSelected ? 'transform:scale(1.5);' : ''}`;
        svg.innerHTML = `
          <circle cx="8" cy="8" r="7" fill="none" stroke="${config.color}" stroke-width="1" opacity="0.8"/>
          <circle cx="8" cy="8" r="4" fill="${config.color}"/>
          <circle cx="8" cy="8" r="2" fill="#fff" opacity="0.9"/>
        `;
        container.appendChild(svg);

        // Hover & Click logic
        container.title = `SIG-${incident.id.substring(0, 4).toUpperCase()} | ${config.label} | ${incident.severityScore}/100`;
        container.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedIncident(incident);
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(createPopupHTML(incident, config));
            infoWindowRef.current.setPosition(new google.maps.LatLng(incident.coordinates.lat, incident.coordinates.lng));
            infoWindowRef.current.setOptions({ pixelOffset: new google.maps.Size(0, -15) });
            infoWindowRef.current.open(map);
          }
        });

        const overlay = new OverlayClass(
          new google.maps.LatLng(incident.coordinates.lat, incident.coordinates.lng),
          container
        );
        overlay.setMap(map);
        overlaysRef.current.push(overlay);
        
        // Keep popup open for selected
        if (isSelected && infoWindowRef.current) {
          infoWindowRef.current.setContent(createPopupHTML(incident, config));
          infoWindowRef.current.setPosition(new google.maps.LatLng(incident.coordinates.lat, incident.coordinates.lng));
          infoWindowRef.current.setOptions({ pixelOffset: new google.maps.Size(0, -15) });
          infoWindowRef.current.open(map);
        }
      });
    }

    // Apply Deck.GL layers (automatically clears if deckLayers is empty!)
    deckOverlayRef.current.setProps({ layers: deckLayers });

    // --- Render Volunteers ---
    const volsToRender = activeLayer === 'volunteers'
      ? volunteers
      : (activeLayer === 'incidents' && selectedVolunteerId)
        ? volunteers.filter(v => v.id === selectedVolunteerId)
        : [];

    volsToRender.forEach((vol) => {
        const initials = vol.name.split(' ').map(n => n[0]).join('');
        const isAvail = vol.isAvailable;
        const color = isAvail ? '#0ea5e9' : '#64748b'; // Brighter Sky Blue vs Slate
        const bg = isAvail ? 'rgba(14, 165, 233, 0.85)' : 'rgba(71, 85, 105, 0.85)';
        const glow = isAvail ? 'rgba(14, 165, 233, 0.6)' : 'rgba(0,0,0,0)';
        
        const container = document.createElement('div');
        container.style.cssText = `
          position:absolute; transform:translate(-50%, -50%);
          width:34px;height:34px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;font-family:monospace;font-weight:bold;letter-spacing:0.5px;
          color:#ffffff;
          background:${bg};
          border:2px solid ${isAvail ? '#38bdf8' : '#94a3b8'};
          box-shadow: 0 0 15px ${glow}, inset 0 0 6px ${glow};
          backdrop-filter: blur(4px);
          cursor: pointer;
        `;
        container.textContent = initials;
        container.title = `${vol.name} | ${vol.isAvailable ? 'AVAILABLE' : 'DEPLOYED'}`;

        const overlay = new OverlayClass(
          new google.maps.LatLng(vol.coordinates.lat, vol.coordinates.lng),
          container
        );
        overlay.setMap(map);
        overlaysRef.current.push(overlay);
      });

    // --- Render Gap Zones ---
    if (activeLayer === 'gaps') {
      const gapZones = [
        { lat: 18.9, lng: 73.4, radius: 15000 },
        { lat: 20.2, lng: 73.1, radius: 20000 },
        { lat: 17.5, lng: 74.0, radius: 18000 },
      ];
      gapZones.forEach((gap) => {
        const outer = new google.maps.Circle({
          map, center: { lat: gap.lat, lng: gap.lng }, radius: gap.radius,
          fillColor: '#EF4444', fillOpacity: 0.06, strokeColor: '#EF4444', strokeOpacity: 0.25, strokeWeight: 1,
        });
        const inner = new google.maps.Circle({
          map, center: { lat: gap.lat, lng: gap.lng }, radius: gap.radius * 0.6,
          fillColor: '#EF4444', fillOpacity: 0.04, strokeColor: '#EF4444', strokeOpacity: 0.15, strokeWeight: 0.5,
        });
        gapCirclesRef.current.push(outer, inner);
      });
    }

  }, [mapReady, activeIncidents, activeLayer, volunteers, selectedIncident, selectedVolunteerId, clearOverlays, createOverlayClass, setSelectedIncident]);

  // Pan to selected incident
  useEffect(() => {
    if (!mapReady || !selectedIncident || !mapRef.current) return;
    mapRef.current.panTo({
      lat: selectedIncident.coordinates.lat,
      lng: selectedIncident.coordinates.lng,
    });
    if (mapRef.current.getZoom()! < 10) {
      mapRef.current.setZoom(11);
    }
  }, [mapReady, selectedIncident]);

  // Fallback map checks
  if (mapsLoaded && !window.google?.maps?.Map) {
    return <FallbackMap activeIncidents={activeIncidents} />;
  }

  return (
    <div className="absolute inset-0 bg-[#070b14]">
      <div ref={mapContainerRef} className="absolute inset-0 z-[1]" />
      {/* Empty state */}
      {mapReady && activeIncidents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-muted font-mono text-sm animate-breathe">
            Awaiting field signals...
          </span>
        </div>
      )}
    </div>
  );
}

// Fallback map logic untouched perfectly matches css mode
function FallbackMap({ activeIncidents }: { activeIncidents: Incident[] }) {
  return (
    <div className="absolute inset-0 bg-[#070b14]">
      <div className="absolute inset-0 bg-grid-overlay opacity-20" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(15, 24, 41, 0.8) 0%, rgba(7, 11, 20, 1) 80%)'
      }} />
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="text-center">
          <span className="text-muted font-mono text-xs block mb-1">
            ⚠ Google Maps Core API missing
          </span>
        </div>
      </div>
    </div>
  );
}

function createPopupHTML(incident: Incident, config: { color: string; label: string }): string {
  const needPills = incident.needTypes
    .map(n => `<span style="display:inline-flex;padding:2px 8px;border-radius:9999px;font-size:9px;font-family:monospace;text-transform:uppercase;letter-spacing:0.05em;background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.2);color:#F97316;margin-right:4px;margin-bottom:4px;">${n}</span>`)
    .join('');

  return `
    <div style="background:#111827;border-radius:8px;padding:12px;min-width:220px;max-width:280px;color:#F9FAFB;font-family:system-ui;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <span style="font-family:monospace;font-size:12px;font-weight:bold;text-transform:uppercase;color:${config.color};">
          SIG-${incident.id.substring(0, 4).toUpperCase()}
        </span>
        <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="${config.color}"/></svg>
        <span style="font-size:9px;font-family:monospace;text-transform:uppercase;color:${config.color};background:${config.color}15;border:1px solid ${config.color}30;padding:1px 6px;border-radius:4px;">
          ${config.label}
        </span>
      </div>
      <div style="margin-bottom:8px;">
        <div style="font-size:9px;font-family:monospace;color:#6B7280;text-transform:uppercase;margin-bottom:4px;">Urgency</div>
        <div style="display:flex;align-items:center;">
          <div style="flex:1;background:rgba(31,41,55,0.5);border-radius:9999px;height:5px;margin-right:8px;">
            <div style="height:100%;border-radius:9999px;width:${incident.severityScore}%;background:${config.color};box-shadow:0 0 6px ${config.color}50;"></div>
          </div>
          <span style="font-family:monospace;font-size:11px;font-weight:bold;color:${config.color};">${incident.severityScore}</span>
        </div>
      </div>
      <div style="margin-bottom:8px;">
        <div style="font-size:9px;font-family:monospace;color:#6B7280;text-transform:uppercase;margin-bottom:4px;">Needs</div>
        <div style="display:flex;flex-wrap:wrap;">${needPills}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;font-size:10px;">
        <span style="font-family:monospace;font-weight:bold;">${incident.affectedCount}</span>
        <span style="color:#6B7280;">affected</span>
        <span style="color:#A5F3FC;font-family:monospace;">conf: ${incident.confidence.toFixed(2)}</span>
      </div>
    </div>
  `;
}
