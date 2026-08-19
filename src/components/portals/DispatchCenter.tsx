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
  Battery
} from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import type { EmergencyType } from '../../types';
import { calculateDistanceKm } from '../../utils/mockData';
import { TacticalMap } from '../maps/TacticalMap';

export const DispatchCenter: React.FC<{ isEmbedded?: boolean }> = () => {
  const { 
    incidents, 
    fleet, 
    hospitals, 
    assignResponderToIncident, 
    triggerCitizenSos 
  } = useEmergency();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [operatorId, setOperatorId] = useState<string>('DISPATCH-OP-09');
  const [operatorPass, setOperatorPass] = useState<string>('admin123');

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [showNewCallModal, setShowNewCallModal] = useState<boolean>(false);
  const [fleetFilter, setFleetFilter] = useState<'all' | 'ambulance' | 'firetruck' | 'police_cruiser'>('all');

  // New manual call form state
  const [newCallType, setNewCallType] = useState<EmergencyType>('medical');
  const [newCallAddress, setNewCallAddress] = useState<string>('Triplicane High Road, Chennai');

  const activeIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'cancelled');
  const pendingIncidents = incidents.filter(i => i.status === 'pending');
  const availableUnits = fleet.filter(u => u.status === 'available');

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || null;

  // Filtered fleet
  const filteredFleet = fleet.filter(u => {
    if (fleetFilter === 'all') return true;
    return u.type === fleetFilter;
  });

  // Calculate sorted nearest available units for selected incident
  const rankedUnits = selectedIncident
    ? availableUnits
        .map(u => ({
          unit: u,
          distance: calculateDistanceKm(u.lat, u.lng, selectedIncident.lat, selectedIncident.lng),
          estimatedMins: Math.ceil(calculateDistanceKm(u.lat, u.lng, selectedIncident.lat, selectedIncident.lng) * 1.5)
        }))
        .sort((a, b) => a.distance - b.distance)
    : [];

  const handleManualCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerCitizenSos(newCallType, 13.0550, 80.2700, newCallAddress);
    setShowNewCallModal(false);
  };

  // If not logged in, show Internal Tool login card
  if (!isAuthenticated) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 bg-[#05070D]">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto text-xl font-bold">
              📡
            </div>
            <h2 className="text-xl font-black text-white">Central Dispatch Login</h2>
            <p className="text-xs text-slate-400">Emergency Operations Control Center</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400">Operator ID / Badge</label>
              <input
                type="text"
                value={operatorId}
                onChange={e => setOperatorId(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Access Key</label>
              <input
                type="password"
                value={operatorPass}
                onChange={e => setOperatorPass(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <button
            onClick={() => setIsAuthenticated(true)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer"
          >
            Authenticate & Open Console
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#05070D] text-slate-100 overflow-hidden">
      
      {/* Top Telemetry KPI Bar */}
      <div className="bg-[#0B0F19] border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Left System Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-black tracking-wider uppercase text-white font-display">
              COMMAND CENTER — CHENNAI CENTRAL
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-[10px] font-mono text-blue-300 font-bold uppercase">
            OPERATOR: {operatorId}
          </span>
        </div>

        {/* Live KPI Metric Chips */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Pending SOS</div>
              <div className="font-mono font-black text-sm text-red-400">{pendingIncidents.length}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
            <Activity className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Active Missions</div>
              <div className="font-mono font-black text-sm text-amber-400">{activeIncidents.length}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
            <Car className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Fleet Available</div>
              <div className="font-mono font-black text-sm text-emerald-400">{availableUnits.length} / {fleet.length}</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
            <TrendingDown className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Avg Response SLA</div>
              <div className="font-mono font-black text-sm text-cyan-400">4.2 min <span className="text-[10px] text-emerald-400">(-68%)</span></div>
            </div>
          </div>

          {/* Quick Manual 911 Call button */}
          <button
            onClick={() => setShowNewCallModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New 112 Call</span>
          </button>
        </div>
      </div>

      {/* Main Command Center Layout: Map (70%) + Dual Sidebar (30%) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Map Viewport (~70%) */}
        <div className="flex-1 h-full relative min-h-[350px]">
          <TacticalMap
            incidents={incidents}
            fleet={fleet}
            hospitals={hospitals}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={id => setSelectedIncidentId(id)}
            onAssignUnit={(incId, unitId) => {
              assignResponderToIncident(incId, unitId);
              setSelectedIncidentId(null);
            }}
          />
        </div>

        {/* Right Command Sidebar (~30% / 360px) */}
        <div className="w-full md:w-96 bg-[#090E1B] border-l border-slate-800 flex flex-col overflow-hidden shrink-0">
          
          {/* Top Panel: Pending Incident Queue */}
          <div className="flex-1 flex flex-col min-h-0 border-b border-slate-800">
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Incident Dispatch Queue ({pendingIncidents.length})
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Live Realtime</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {pendingIncidents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                  <div className="text-xs font-semibold">All Incidents Dispatched</div>
                  <div className="text-[11px]">No unassigned SOS alerts in the city queue.</div>
                </div>
              ) : (
                pendingIncidents.map(inc => {
                  const elapsedSec = Math.floor((Date.now() - inc.createdAt) / 1000);
                  const isSelected = selectedIncidentId === inc.id;

                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-red-950/60 border-red-500 shadow-lg shadow-red-950/40' 
                          : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                          {inc.type === 'medical' ? '🚑' : inc.type === 'fire' ? '🚒' : '🚓'} {inc.type.toUpperCase()} SOS
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {elapsedSec}s ago
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-200 truncate">{inc.address}</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{inc.description}</div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
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

          {/* Bottom Panel: Live Fleet Manager List */}
          <div className="h-60 flex flex-col min-h-0 bg-[#070B14]">
            <div className="p-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Fleet Status ({fleet.length})
              </span>
              
              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1">
                {(['all', 'ambulance', 'firetruck', 'police_cruiser'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFleetFilter(type)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      fleetFilter === type ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'
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
                    className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        isAvail ? 'bg-emerald-500' : isEnRoute ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'
                      }`} />
                      <div>
                        <div className="font-bold text-slate-200">{unit.callsign}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{unit.driverName}</div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        isAvail ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        isEnRoute ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-slate-800 text-slate-400'
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

      {/* Smart Allocation Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedIncident.title}</h3>
                  <p className="text-xs text-slate-400">{selectedIncident.address}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncidentId(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Smart Ranking Algorithm List */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Ranked Nearest Available Units (Live Distance Calculation)</span>
                <span className="text-cyan-400 font-mono">AI Dispatch Engine</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {rankedUnits.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs text-center">
                    All nearby units currently occupied. Override or assign from secondary zone.
                  </div>
                ) : (
                  rankedUnits.map(({ unit, distance, estimatedMins }, idx) => (
                    <div
                      key={unit.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        idx === 0 
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md' 
                          : 'bg-slate-800/80 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            {unit.callsign}
                            {idx === 0 && (
                              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] rounded font-bold uppercase">
                                BEST MATCH
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{unit.driverName}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-white">{distance} km</div>
                          <div className="text-[10px] font-mono text-amber-400">ETA ~{estimatedMins} min</div>
                        </div>

                        <button
                          onClick={() => {
                            assignResponderToIncident(selectedIncident.id, unit.id);
                            setSelectedIncidentId(null);
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all cursor-pointer"
                        >
                          Dispatch Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedIncidentId(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Manual 911 / 112 Call Modal */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleManualCallSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white">Manual 112 Emergency Call</h3>
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
                <label className="text-xs font-semibold text-slate-400">Emergency Type</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['medical', 'fire', 'police'] as const).map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setNewCallType(t)}
                      className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                        newCallType === t 
                          ? 'bg-red-600 text-white shadow' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {t === 'medical' ? '🚑 Med' : t === 'fire' ? '🚒 Fire' : '🚓 Police'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Location / Address</label>
                <input
                  type="text"
                  value={newCallAddress}
                  onChange={e => setNewCallAddress(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewCallModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-slate-300"
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
