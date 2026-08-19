import React from 'react';
import { 
  CheckCircle2, 
  UserCheck, 
  Bed, 
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { StaffHeader } from '../navigation/StaffHeader';

export const HospitalBoard: React.FC = () => {
  const { 
    hospitals, 
    incidents, 
    fleet, 
    toggleHospitalCapacity, 
    receivePatientAdmit 
  } = useEmergency();

  const { hospitalId } = useAuth();

  // Scoped strictly to logged-in staff's assigned hospital (no switcher)
  const activeHospital = hospitals.find(h => h.id === (hospitalId || 'hosp-2')) || hospitals[0];

  // Inbound ambulances heading to this hospital
  const inboundIncidents = incidents.filter(i => 
    i.assignedHospitalId === activeHospital.id && 
    (i.status === 'transporting' || i.status === 'on_scene' || (i.status === 'en_route' && i.assignedUnitId))
  ).sort((a, b) => a.etaSeconds - b.etaSeconds);

  // Resolved incidents at this facility
  const resolvedIncidents = incidents.filter(i => 
    i.assignedHospitalId === activeHospital.id && i.status === 'resolved'
  );

  const isAccepting = activeHospital.status === 'accepting';
  const availableBeds = activeHospital.totalBeds - activeHospital.occupiedBeds;

  const handlePatientReceived = async (incidentId: string) => {
    await receivePatientAdmit(activeHospital.id, incidentId);

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
    <div className="w-screen h-screen flex flex-col bg-slate-950 dark:bg-[#05070D] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* Staff Header */}
      <StaffHeader 
        title={`ER Triage Board — ${activeHospital.name}`}
        roleBadge="HOSPITAL ER OPERATIONS"
        badgeColor="bg-emerald-600/20 text-emerald-400 border-emerald-500/40"
      />

      {/* Top Ambient Hospital Sub-Header */}
      <div className="bg-slate-100 dark:bg-[#0A101D] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-10 shrink-0">
        
        {/* Hospital Identity (Static scoped display - no dropdown) */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-lg border ${
            isAccepting ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-500' : 'bg-red-600/20 border-red-500/40 text-red-500'
          }`}>
            🏥
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-display">
              {activeHospital.name}
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
              <span>{activeHospital.address}</span>
              <span>•</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">{activeHospital.shortCode}</span>
            </div>
          </div>
        </div>

        {/* Live ER Bed Capacity Counters */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Available Beds</div>
              <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                <span className={availableBeds === 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}>{availableBeds}</span>
                <span className="text-slate-400 text-xs font-normal"> / {activeHospital.totalBeds}</span>
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">ICU Bays Ready</div>
            <div className="text-base font-black font-mono text-cyan-600 dark:text-cyan-400">
              {activeHospital.icuBedsAvailable}
            </div>
          </div>
        </div>

        {/* Citywide Live Capacity Toggle */}
        <div>
          <button
            onClick={async () => await toggleHospitalCapacity(activeHospital.id)}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm tracking-wide uppercase transition-all shadow-xl flex items-center gap-2.5 cursor-pointer active:scale-95 ${
              isAccepting
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400/60 shadow-emerald-950/40'
                : 'bg-red-600 hover:bg-red-500 text-white border-2 border-red-400/60 shadow-red-950/40 animate-pulse'
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${isAccepting ? 'bg-white' : 'bg-white animate-ping'}`} />
            <span>{isAccepting ? '🟢 ACCEPTING INBOUND ER' : '⛔ ER FULL (DIVERSION)'}</span>
          </button>
        </div>

      </div>

      {/* Main Receiving Display Table */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-[#05070D]">
        
        {/* Inbound Ambulance Receiving Queue */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider font-display">
                Live Inbound Trauma Queue ({inboundIncidents.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">Sorted by Arrival ETA</span>
          </div>

          {inboundIncidents.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-3xl text-slate-400">
                🚑
              </div>
              <div className="text-base font-bold text-slate-700 dark:text-slate-300">No Inbound Ambulances In Transit</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Trauma resuscitation bays are clear. Dispatch will stream telemetry the moment an ambulance begins transit here.
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
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-500 shadow-red-950/30 animate-pulse' 
                        : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Unit & Condition */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-3xl shrink-0">
                        🚑
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-900 dark:text-white font-display">
                            {assignedUnit?.callsign || 'Ambulance Unit'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-600 text-white">
                            {inc.severity || 'CRITICAL'}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-amber-600 dark:text-amber-300">
                          {inc.patientVitals?.condition || inc.title}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Paramedic: {assignedUnit?.driverName || 'EMT Crew'} • Origin: {inc.address.split(',')[0]}
                        </div>

                        {inc.description && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 italic flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-cyan-500" />
                            <span>"{inc.description}"</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vitals Telemetry */}
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-4 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Blood Pressure</div>
                        <div className="font-bold text-cyan-600 dark:text-cyan-400">{inc.patientVitals?.bloodPressure || '145/90'}</div>
                      </div>
                      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Heart Rate</div>
                        <div className="font-bold text-red-600 dark:text-red-400">{inc.patientVitals?.heartRate || 104} BPM</div>
                      </div>
                      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">SpO2</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">{inc.patientVitals?.oxygenSat || 95}%</div>
                      </div>
                    </div>

                    {/* ETA & Patient Received Action */}
                    <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200 dark:border-slate-800">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Estimated Touchdown</div>
                        <div className={`text-3xl font-black font-mono ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {inc.etaSeconds <= 0 ? 'AT BAY' : `${etaMins} MIN`}
                        </div>
                      </div>

                      <button
                        onClick={() => handlePatientReceived(inc.id)}
                        className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm shadow-xl border border-emerald-400 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
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

        {/* Recently Admitted Patients Today */}
        {resolvedIncidents.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Successfully Admitted Patients Today ({resolvedIncidents.length})
              </h3>
            </div>

            <div className="space-y-2">
              {resolvedIncidents.map(inc => (
                <div 
                  key={inc.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ ADMITTED</span>
                    <span className="font-bold text-slate-900 dark:text-white">{inc.title}</span>
                    <span className="text-slate-500">{inc.address.split(',')[0]}</span>
                  </div>
                  <span className="font-mono text-slate-400">Loop Closed • Unit Released</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
