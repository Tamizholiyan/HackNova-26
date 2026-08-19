import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Incident, ResponderUnit, Hospital } from '../../types';
import { calculateDistanceKm } from '../../utils/mockData';

interface TacticalMapProps {
  incidents: Incident[];
  fleet: ResponderUnit[];
  hospitals: Hospital[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (incidentId: string) => void;
  onAssignUnit?: (incidentId: string, unitId: string) => void;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
}

// Custom Leaflet DivIcons
const createIncidentIcon = (type: 'medical' | 'fire' | 'police', status: string) => {
  const isPending = status === 'pending';
  const color = type === 'medical' ? '#EF4444' : type === 'fire' ? '#F97316' : '#3B82F6';
  const symbol = type === 'medical' ? '🚑' : type === 'fire' ? '🚒' : '🚓';

  return L.divIcon({
    className: 'custom-incident-marker',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 -ml-2 -mt-2">
        ${isPending ? `<div class="absolute w-12 h-12 rounded-full animate-ping opacity-75" style="background-color: ${color};"></div>` : ''}
        <div class="relative z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-base ${isPending ? 'animate-bounce' : ''}" style="background-color: ${color};">
          <span>${symbol}</span>
        </div>
        <div class="absolute -bottom-1 w-3 h-3 rotate-45" style="background-color: ${color};"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

const createVehicleIcon = (unit: ResponderUnit) => {
  const color = unit.type === 'ambulance' ? '#EF4444' : unit.type === 'firetruck' ? '#F97316' : '#3B82F6';
  const symbol = unit.type === 'ambulance' ? '🚑' : unit.type === 'firetruck' ? '🚒' : '🚓';
  const isEnRoute = unit.status === 'en_route' || unit.status === 'transporting';

  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div class="relative flex flex-col items-center justify-center">
        ${isEnRoute ? `<div class="absolute w-10 h-10 rounded-full animate-ping opacity-50" style="background-color: ${color};"></div>` : ''}
        <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-md border border-slate-700 bg-slate-900 text-sm">
          <span>${symbol}</span>
        </div>
        <div class="mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono font-bold text-white whitespace-nowrap shadow">
          ${unit.callsign.split(' ')[1] || unit.callsign}
        </div>
      </div>
    `,
    iconSize: [32, 48],
    iconAnchor: [16, 24],
    popupAnchor: [0, -24]
  });
};

const createHospitalIcon = (hospital: Hospital) => {
  const isAccepting = hospital.status === 'accepting';
  const bgColor = isAccepting ? '#10B981' : '#EF4444';

  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div class="relative flex flex-col items-center justify-center">
        <div class="w-8 h-8 rounded-md flex items-center justify-center shadow-lg border-2 border-white text-white font-bold text-xs" style="background-color: ${bgColor};">
          🏥
        </div>
        <div class="mt-0.5 px-1 py-0.5 rounded text-[9px] font-bold font-mono text-white ${isAccepting ? 'bg-emerald-950/90 border border-emerald-500/60' : 'bg-red-950/90 border border-red-500/60'} whitespace-nowrap shadow">
          ${hospital.shortCode} • ${hospital.status === 'accepting' ? `${hospital.totalBeds - hospital.occupiedBeds} Beds` : 'FULL'}
        </div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 22],
    popupAnchor: [0, -22]
  });
};

// Map Recenter Helper Component
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

export const TacticalMap: React.FC<TacticalMapProps> = ({
  incidents,
  fleet,
  hospitals,
  onSelectIncident,
  onAssignUnit,
  center = [13.0500, 80.2724],
  zoom = 13,
  interactive = true
}) => {
  // Collect all active polylines
  const activeRoutes = useMemo(() => {
    return fleet
      .filter(u => (u.status === 'en_route' || u.status === 'transporting') && u.routeCoords && u.routeCoords.length > 0)
      .map(u => ({
        unitId: u.id,
        callsign: u.callsign,
        coords: u.routeCoords as [number, number][],
        color: u.type === 'ambulance' ? '#EF4444' : u.type === 'firetruck' ? '#F97316' : '#3B82F6'
      }));
  }, [fleet]);

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-xl bg-[#0B0F19] border border-slate-800 shadow-inner">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        attributionControl={false}
        className="w-full h-full z-0"
      >
        <MapUpdater center={center} zoom={zoom} />

        {/* Tactical Dark TileLayer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Active Route Polylines */}
        {activeRoutes.map(route => (
          <Polyline
            key={`route-${route.unitId}`}
            positions={route.coords}
            pathOptions={{
              color: route.color,
              weight: 4,
              opacity: 0.85,
              dashArray: '8, 8',
              lineCap: 'round'
            }}
          />
        ))}

        {/* Hospital Markers */}
        {hospitals.map(hospital => (
          <Marker
            key={hospital.id}
            position={[hospital.lat, hospital.lng]}
            icon={createHospitalIcon(hospital)}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5 mb-2">
                  <span className="font-bold text-sm text-slate-100">{hospital.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${hospital.status === 'accepting' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {hospital.status === 'accepting' ? 'ACCEPTING' : 'ER FULL'}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <p><strong className="text-slate-400">Available Beds:</strong> <span className="font-mono text-emerald-400 font-bold">{hospital.totalBeds - hospital.occupiedBeds}</span> / {hospital.totalBeds}</p>
                  <p><strong className="text-slate-400">ICU Bays:</strong> <span className="font-mono text-cyan-400">{hospital.icuBedsAvailable}</span></p>
                  <p className="text-[11px] text-slate-400 truncate">{hospital.address}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Fleet Vehicle Markers */}
        {fleet.map(unit => (
          <Marker
            key={unit.id}
            position={[unit.lat, unit.lng]}
            icon={createVehicleIcon(unit)}
          >
            <Popup>
              <div className="p-1 min-w-[190px]">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1 mb-2">
                  <span className="font-bold text-sm text-slate-100">{unit.callsign}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-cyan-400">
                    {unit.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <p><strong className="text-slate-400">Crew:</strong> {unit.driverName}</p>
                  <p><strong className="text-slate-400">Speed:</strong> <span className="font-mono">{unit.speedKmh} km/h</span></p>
                  <p><strong className="text-slate-400">Battery:</strong> <span className="font-mono text-emerald-400">{unit.batteryPercent}%</span></p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Incident Markers */}
        {incidents.filter(i => i.status !== 'resolved' && i.status !== 'cancelled').map(incident => {
          const availableUnits = fleet
            .filter(u => u.status === 'available')
            .map(u => ({
              unit: u,
              distance: calculateDistanceKm(u.lat, u.lng, incident.lat, incident.lng)
            }))
            .sort((a, b) => a.distance - b.distance);

          return (
            <Marker
              key={incident.id}
              position={[incident.lat, incident.lng]}
              icon={createIncidentIcon(incident.type, incident.status)}
              eventHandlers={{
                click: () => onSelectIncident && onSelectIncident(incident.id)
              }}
            >
              <Popup>
                <div className="p-1 min-w-[240px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1 mb-2">
                    <span className="font-bold text-sm text-red-400 flex items-center gap-1">
                      🚨 {incident.title.split(' ')[0]} Alert
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                      {incident.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 font-medium">{incident.address}</p>

                  {incident.status === 'pending' && onAssignUnit && (
                    <div className="mt-2 pt-2 border-t border-slate-700/60">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Recommended Closest Units:
                      </div>
                      <div className="space-y-1.5">
                        {availableUnits.slice(0, 2).map(({ unit, distance }) => (
                          <div key={unit.id} className="flex items-center justify-between p-1.5 rounded bg-slate-800/80 border border-slate-700">
                            <div>
                              <div className="text-xs font-bold text-white">{unit.callsign}</div>
                              <div className="text-[10px] text-slate-400">{distance} km • ETA ~{Math.ceil(distance * 1.5)}m</div>
                            </div>
                            <button
                              onClick={() => onAssignUnit(incident.id, unit.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold shadow-md transition-all cursor-pointer"
                            >
                              Assign
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block"></span>
          <span>Pending SOS</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span>En Route</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>ER Open</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
          <span>ER Full</span>
        </div>
      </div>
    </div>
  );
};
