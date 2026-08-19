import React from 'react';
import { 
  CheckCircle2, 
  UserCheck, 
  Bed
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEmergency } from '../../context/EmergencyContext';

export const HospitalBoard: React.FC<{ isEmbedded?: boolean }> = () => {
  const { 
    hospitals, 
    activeHospital, 
    setActiveHospitalId, 
    incidents, 
    fleet, 
    toggleHospitalCapacity, 
    receivePatientAdmit 
  } = useEmergency();

  // Inbound ambulances heading to this hospital
  const inboundIncidents = incidents.filter(i => 
    i.targetHospitalId === activeHospital.id && 
    (i.status === 'transporting' || i.status === 'on_scene' || (i.status === 'en_route' && i.assignedUnitId))
  ).sort((a, b) => a.etaSeconds - b.etaSeconds);

  // Resolved incidents at this facility
  const resolvedIncidents = incidents.filter(i => 
    i.targetHospitalId === activeHospital.id && i.status === 'resolved'
  );

  const isAccepting = activeHospital.status === 'accepting';
  const availableBeds = activeHospital.totalBeds - activeHospital.occupiedBeds;

  const handlePatientReceived = (incidentId: string) => {
    receivePatientAdmit(activeHospital.id, incidentId);

    // Trigger celebratory confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // safe catch
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#05070D] text-slate-100 overflow-hidden">
      
      {/* Top Ambient Hospital Header Bar */}
      <div className="bg-[#0A101D] border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 z-10 shrink-0">
        
        {/* Left Hospital Selector & Identity */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border ${
            isAccepting ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' : 'bg-red-600/20 border-red-500/40 text-red-400'
          }`}>
            🏥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={activeHospital.id}
                onChange={e => setActiveHospitalId(e.target.value)}
                className="bg-transparent text-lg sm:text-xl font-black text-white focus:outline-none cursor-pointer hover:text-emerald-400 transition-colors font-display"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id} className="bg-slate-900 text-white">
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>{activeHospital.address.split(',')[0]}</span>
              <span>•</span>
              <span className="text-cyan-400">Emergency & Trauma Center</span>
            </div>
          </div>
        </div>

        {/* Center: Live Bed Occupancy Counter */}
        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">ER Capacity</div>
              <div className="text-base font-black font-mono text-white">
                <span className={availableBeds === 0 ? 'text-red-400' : 'text-emerald-400'}>{availableBeds}</span>
                <span className="text-slate-500 text-xs font-normal"> / {activeHospital.totalBeds} beds</span>
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">ICU Bays</div>
            <div className="text-base font-black font-mono text-cyan-400">
              {activeHospital.icuBedsAvailable} <span className="text-[10px] text-slate-500 font-normal">Ready</span>
            </div>
          </div>
        </div>

        {/* Right: GIANT ONE-CLICK CAPACITY TOGGLE */}
        <div>
          <button
            onClick={() => toggleHospitalCapacity(activeHospital.id)}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm tracking-wide uppercase transition-all shadow-xl flex items-center gap-2.5 cursor-pointer active:scale-95 ${
              isAccepting
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400/60 shadow-emerald-950/60'
                : 'bg-red-600 hover:bg-red-500 text-white border-2 border-red-400/60 shadow-red-950/60 animate-pulse'
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${isAccepting ? 'bg-white' : 'bg-white animate-ping'}`} />
            <span>{isAccepting ? '🟢 ACCEPTING INBOUND ER' : '⛔ ER FULL (DIVERSION)'}</span>
          </button>
        </div>

      </div>

      {/* Main Receiving Display Table */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        
        {/* Inbound Ambulance Receiving Queue */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Live Inbound Trauma Queue ({inboundIncidents.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Sorted by Arrival ETA</span>
          </div>

          {inboundIncidents.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-3xl text-slate-500">
                🚑
              </div>
              <div className="text-base font-bold text-slate-300">No Inbound Ambulances In Transit</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Trauma resuscitation bays are clear. Central Dispatch will stream telemetry the moment an ambulance routes here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {inboundIncidents.map(inc => {
                const assignedUnit = fleet.find(u => u.id === inc.assignedUnitId);
                const etaMins = Math.ceil(inc.etaSeconds / 60);
                const isUrgent = inc.etaSeconds <= 180;

                return (
                  <div
                    key={inc.id}
                    className={`p-5 rounded-2xl border-2 transition-all shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isUrgent 
                        ? 'bg-red-950/40 border-red-500 shadow-red-950/40 animate-pulse' 
                        : 'bg-slate-900/90 border-slate-700'
                    }`}
                  >
                    {/* Left: Unit & Triage Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shrink-0">
                        🚑
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-white">{assignedUnit?.callsign || 'Ambulance Unit'}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                            {inc.patientVitals?.severity || 'CRITICAL'}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-amber-300">
                          {inc.patientVitals?.condition || inc.title}
                        </div>

                        <div className="text-xs text-slate-400 font-mono">
                          Paramedic: {assignedUnit?.driverName || 'EMT Crew'} • Origin: {inc.address.split(',')[0]}
                        </div>
                      </div>
                    </div>

                    {/* Center: Live Vitals Telemetry Chip */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center gap-4 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Blood Pressure</div>
                        <div className="font-bold text-cyan-400">{inc.patientVitals?.bloodPressure || '150/92'}</div>
                      </div>
                      <div className="h-6 w-px bg-slate-800" />
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Heart Rate</div>
                        <div className="font-bold text-red-400">{inc.patientVitals?.heartRate || 108} BPM</div>
                      </div>
                      <div className="h-6 w-px bg-slate-800" />
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">SpO2</div>
                        <div className="font-bold text-emerald-400">{inc.patientVitals?.oxygenSat || 94}%</div>
                      </div>
                    </div>

                    {/* Right: Big ETA Counter & Resolution Action */}
                    <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated Touchdown</div>
                        <div className={`text-3xl font-black font-mono ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
                          {inc.etaSeconds <= 0 ? 'AT BAY' : `${etaMins} MIN`}
                        </div>
                      </div>

                      <button
                        onClick={() => handlePatientReceived(inc.id)}
                        className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-950/60 border border-emerald-400 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                      >
                        <UserCheck className="w-5 h-5" />
                        <span>PATIENT RECEIVED</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently Resolved Inbound Cases */}
        {resolvedIncidents.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Successfully Admitted Patients Today ({resolvedIncidents.length})
              </h3>
            </div>

            <div className="space-y-2">
              {resolvedIncidents.map(inc => (
                <div 
                  key={inc.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">✓ ADMITTED</span>
                    <span className="font-bold text-white">{inc.title}</span>
                    <span className="text-slate-400">{inc.address.split(',')[0]}</span>
                  </div>
                  <span className="font-mono text-slate-500">Loop Closed • Unit Freed</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
