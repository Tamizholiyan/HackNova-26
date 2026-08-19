import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Car, 
  Clock, 
  Activity, 
  CheckCircle2, 
  Plus, 
  ChevronRight, 
  TrendingDown, 
  Battery, 
  Hospital as HospIcon,
  MessageSquare
} from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { StaffHeader } from '../navigation/StaffHeader';
import type { EmergencyType, Hospital } from '../../types';
import { calculateDistanceKm } from '../../utils/mockData';
import { TacticalMap } from '../maps/TacticalMap';

export const DispatchCenter: React.FC = () => {
  const { 
    incidents, 
    fleet, 
    hospitals, 
    assignResponderToIncident, 
    overrideAssignedHospital,
    triggerCitizenSos 
  } = useEmergency();

  const { user } = useAuth();

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [showNewCallModal, setShowNewCallModal] = useState<boolean>(false);
  const [fleetFilter, setFleetFilter] = useState<'all' | 'ambulance' | 'firetruck' | 'police_cruiser'>('all');

  // Manual 112 Call Form State
  const [newCallType, setNewCallType] = useState<EmergencyType>('medical');
  const [newCallAddress, setNewCallAddress] = useState<string>('Triplicane High Road, Chennai');

  const activeIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'cancelled');
  const pendingIncidents = incidents.filter(i => i.status === 'pending');
  const availableUnits = fleet.filter(u => u.status === 'available');

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || null;

  // Filter fleet based on unit type filter
  const filteredFleet = fleet.filter(u => {
    if (fleetFilter === 'all') return true;
    return u.type === fleetFilter;
  });

  // Strict Type Matching for Smart Allocation: only units matching incident type
  const matchingAvailableUnits = selectedIncident
    ? availableUnits.filter(u => {
        if (selectedIncident.type === 'medical') return u.type === 'ambulance';
        if (selectedIncident.type === 'fire') return u.type === 'firetruck';
        if (selectedIncident.type === 'police') return u.type === 'police_cruiser';
        return true;
      })
    : [];

  const rankedUnits = selectedIncident
    ? matchingAvailableUnits
        .map(u => ({
          unit: u,
          distance: calculateDistanceKm(u.lat, u.lng, selectedIncident.lat, selectedIncident.lng),
          estimatedMins: Math.ceil(calculateDistanceKm(u.lat, u.lng, selectedIncident.lat, selectedIncident.lng) * 1.5)
        }))
        .sort((a, b) => a.distance - b.distance)
    : [];

  const handleManualCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerCitizenSos(newCallType, 13.0550, 80.2700, newCallAddress);
    setShowNewCallModal(false);
  };

  // Find assigned hospital for an incident
  const getAssignedHospital = (hospId?: string): Hospital | undefined => {
    if (!hospId) return undefined;
    return hospitals.find(h => h.id === hospId);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 dark:bg-[#05070D] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* Scoped Dispatch Staff Header */}
      <StaffHeader 
        title="Central Emergency Operations Console" 
        roleBadge="DISPATCH COMMAND"
        badgeColor="bg-blue-600/20 text-blue-400 border-blue-500/40"
      />

      {/* Top KPI Metric Bar */}
      <div className="bg-slate-100 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black tracking-wider uppercase text-slate-800 dark:text-white font-display">
              CITYWIDE MATRIX TELEMETRY
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Dispatcher: <strong className="text-slate-700 dark:text-slate-200">{user?.fullName || 'V. Anand'}</strong>
          </span>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-lg">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold">Pending SOS</div>
              <div className="font-mono font-black text-sm text-red-600 dark:text-red-400">{pendingIncidents.length}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-lg">
            <Activity className="w-4 h-4 text-amber-500" />
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold">Active Missions</div>
              <div className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">{activeIncidents.length}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-lg">
            <Car className="w-4 h-4 text-emerald-500" />
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold">Fleet Available</div>
              <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">{availableUnits.length} / {fleet.length}</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-lg">
            <TrendingDown className="w-4 h-4 text-cyan-500" />
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold">Avg Response SLA</div>
              <div className="font-mono font-black text-sm text-cyan-600 dark:text-cyan-400">4.2 min</div>
            </div>
          </div>

          {/* New 112 Call Button */}
          <button
            onClick={() => setShowNewCallModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New 112 Call</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Tactical Map (70%) + Sidebar (30%) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Tactical Map Viewport */}
        <div className="flex-1 h-full relative min-h-[350px]">
          <TacticalMap
            incidents={incidents}
            fleet={fleet}
            hospitals={hospitals}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={id => setSelectedIncidentId(id)}
            onAssignUnit={async (incId, unitId) => {
              await assignResponderToIncident(incId, unitId);
              setSelectedIncidentId(null);
            }}
          />
        </div>

        {/* Right Command Sidebar */}
        <div className="w-full md:w-96 bg-slate-50 dark:bg-[#090E1B] border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shrink-0">
          
          {/* Top Panel: Pending Incident Queue */}
          <div className="flex-1 flex flex-col min-h-0 border-b border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                  Incident Dispatch Queue ({pendingIncidents.length})
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Live Realtime</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {pendingIncidents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">All Incidents Dispatched</div>
                  <div className="text-[11px] text-slate-500">No unassigned SOS alerts in city queue.</div>
                </div>
              ) : (
                pendingIncidents.map(inc => {
                  const elapsedSec = Math.floor((Date.now() - inc.createdAt) / 1000);
                  const isSelected = selectedIncidentId === inc.id;
                  const autoHosp = getAssignedHospital(inc.assignedHospitalId);

                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-red-50 dark:bg-red-950/60 border-red-500 shadow-md' 
                          : 'bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-red-600 dark:text-red-400">
                            {inc.type === 'medical' ? '🚑' : inc.type === 'fire' ? '🚒' : '🚓'} {inc.type.toUpperCase()} SOS
                          </span>
                          {/* Severity Badge */}
                          {inc.severity && (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                              inc.severity === 'CRITICAL' || inc.severity === 'SEVERE'
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-500 text-black'
                            }`}>
                              {inc.severity}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {elapsedSec}s ago
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{inc.address}</div>

                      {/* Citizen Description Excerpt */}
                      {inc.description && (
                        <div className="mt-1 flex items-start gap-1 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 p-1.5 rounded border border-slate-200 dark:border-slate-800/80">
                          <MessageSquare className="w-3 h-3 text-cyan-500 shrink-0 mt-0.5" />
                          <span className="truncate italic">"{inc.description}"</span>
                        </div>
                      )}

                      {/* Auto-Assigned Hospital Preview */}
                      {autoHosp && (
                        <div className="mt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <HospIcon className="w-3 h-3" />
                          <span>Target: {autoHosp.shortCode} ({autoHosp.status === 'accepting' ? 'Accepting' : 'Full'})</span>
                        </div>
                      )}

                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">ID: {inc.id}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncidentId(inc.id);
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold shadow transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Smart Allocate</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Panel: Live Fleet List */}
          <div className="h-60 flex flex-col min-h-0 bg-slate-100 dark:bg-[#070B14]">
            <div className="p-2.5 bg-slate-200/80 dark:bg-slate-900/80 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                Fleet Status ({fleet.length})
              </span>
              
              <div className="flex items-center gap-1">
                {(['all', 'ambulance', 'firetruck', 'police_cruiser'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFleetFilter(type)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      fleetFilter === type ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    {type === 'all' ? 'All' : type === 'ambulance' ? '🚑' : type === 'firetruck' ? '🚒' : '🚓'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredFleet.map(unit => {
                const isAvail = unit.status === 'available';
                const isEnRoute = unit.status === 'en_route' || unit.status === 'transporting';

                return (
                  <div 
                    key={unit.id}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        isAvail ? 'bg-emerald-500' : isEnRoute ? 'bg-amber-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'
                      }`} />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-200">{unit.callsign}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[140px]">{unit.driverName}</div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        isAvail ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' :
                        isEnRoute ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                        'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {unit.status.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Battery className="w-3 h-3 text-emerald-500" />
                        <span>{unit.batteryPercent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Smart Allocation Modal (Strict Unit Type Filtered) */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedIncident.title}</span>
                    {selectedIncident.severity && (
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold">
                        {selectedIncident.severity}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedIncident.address}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncidentId(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Incident Description */}
            {selectedIncident.description && (
              <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-900 dark:text-cyan-200 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cyan-700 dark:text-cyan-300">Citizen Note:</strong> "{selectedIncident.description}"
                </div>
              </div>
            )}

            {/* Auto-Assigned Hospital with Override Option */}
            {selectedIncident.type === 'medical' && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Auto-Assigned Hospital Destination</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <HospIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{getAssignedHospital(selectedIncident.assignedHospitalId)?.name || 'Auto Calculating...'}</span>
                  </div>
                </div>

                <select
                  value={selectedIncident.assignedHospitalId || ''}
                  onChange={e => overrideAssignedHospital(selectedIncident.id, e.target.value)}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.shortCode} ({h.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Strict Type-Filtered Units List */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span>Nearest Matching Units ({selectedIncident.type.toUpperCase()})</span>
                <span className="text-cyan-500 font-mono text-[10px]">Auto-Ranked by Distance</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {rankedUnits.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs text-center">
                    No available {selectedIncident.type} units nearby. Reallocate from adjacent zone.
                  </div>
                ) : (
                  rankedUnits.map(({ unit, distance, estimatedMins }, idx) => (
                    <div
                      key={unit.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        idx === 0 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/50 shadow-sm' 
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {unit.callsign}
                            {idx === 0 && (
                              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-[9px] rounded font-bold uppercase">
                                BEST MATCH
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{unit.driverName}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-slate-800 dark:text-white">{distance} km</div>
                          <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400">ETA ~{estimatedMins} min</div>
                        </div>

                        <button
                          onClick={async () => {
                            await assignResponderToIncident(selectedIncident.id, unit.id);
                            setSelectedIncidentId(null);
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
                        >
                          Dispatch Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedIncidentId(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Manual 112 Emergency Call Modal */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleManualCallSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Manual 112 Emergency Call</h3>
              <button
                type="button"
                onClick={() => setShowNewCallModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Emergency Type</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['medical', 'fire', 'police'] as const).map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setNewCallType(t)}
                      className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                        newCallType === t 
                          ? 'bg-red-600 text-white shadow' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {t === 'medical' ? '🚑 Med' : t === 'fire' ? '🚒 Fire' : '🚓 Police'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Location / Address</label>
                <input
                  type="text"
                  value={newCallAddress}
                  onChange={e => setNewCallAddress(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewCallModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow"
              >
                Drop SOS Pin
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
