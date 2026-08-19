import React, { useState } from 'react';
import { 
  Navigation, 
  CheckCircle2, 
  MapPin, 
  Hospital as HospIcon, 
  Battery, 
  Gauge, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { calculateDistanceKm } from '../../utils/mockData';
import { TacticalMap } from '../maps/TacticalMap';
import { sound } from '../../utils/audioSynth';

export const ResponderPortal: React.FC<{ isEmbedded?: boolean }> = () => {
  const { 
    fleet, 
    incidents, 
    hospitals, 
    activeResponder, 
    setActiveResponderId, 
    acceptMission, 
    markArrivedOnScene, 
    startHospitalTransport, 
    markArrivedAtHospital,
    toggleDutyStatus 
  } = useEmergency();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>('1234');
  const [showHospitalModal, setShowHospitalModal] = useState<boolean>(false);

  // Find mission assigned to this responder unit
  const assignedIncident = incidents.find(i => 
    i.assignedUnitId === activeResponder.id && i.status !== 'resolved' && i.status !== 'cancelled'
  );

  const isMissionAssigned = assignedIncident && assignedIncident.status === 'assigned';
  const isEnRouteToScene = assignedIncident && assignedIncident.status === 'en_route';
  const isOnScene = assignedIncident && assignedIncident.status === 'on_scene';
  const isTransporting = assignedIncident && assignedIncident.status === 'transporting';

  // Handle PIN Pad digit
  const handlePinPress = (digit: string) => {
    sound.playTactileClick();
    if (pinInput.length < 4) {
      setPinInput(prev => prev + digit);
    }
  };

  const handlePinClear = () => {
    sound.playTactileClick();
    setPinInput('');
  };

  const handlePinSubmit = () => {
    sound.playTactileClick();
    if (pinInput.length >= 4) {
      setIsLoggedIn(true);
    }
  };

  // --- VIEW 1: HIGH-STRESS ONE-HANDED PIN LOGIN ---
  if (!isLoggedIn) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 bg-[#05070D]">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto text-3xl">
              🚑
            </div>
            <h2 className="text-2xl font-black text-white">Responder Mobile MDT</h2>
            <p className="text-xs text-slate-400">Tactical Mobile Data Terminal</p>
          </div>

          {/* Unit Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Assigned Vehicle</label>
            <select
              value={activeResponder.id}
              onChange={e => setActiveResponderId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none"
            >
              {fleet.map(u => (
                <option key={u.id} value={u.id}>
                  {u.callsign} ({u.driverName.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Big Number PIN Pad */}
          <div className="space-y-3">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 ${
                    pinInput.length > i ? 'bg-red-500 border-red-500' : 'border-slate-600 bg-slate-800'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'GO'].map(btn => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'CLR') handlePinClear();
                    else if (btn === 'GO') handlePinSubmit();
                    else handlePinPress(btn);
                  }}
                  className={`h-14 rounded-xl font-bold text-lg flex items-center justify-center transition-all active:scale-95 ${
                    btn === 'GO' 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                      : btn === 'CLR' 
                      ? 'bg-slate-800 text-slate-400' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- VIEW 2: FULLSCREEN URGENT "ACCEPT MISSION" FLASH ALERT ---
  if (isMissionAssigned && assignedIncident) {
    return (
      <div className="w-full h-full bg-red-950 flex flex-col items-center justify-between p-6 animate-flash-alert select-none overflow-hidden relative border-8 border-red-600">
        
        {/* Urgent Header */}
        <div className="text-center space-y-2 mt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600 text-white font-black text-sm tracking-widest uppercase animate-bounce shadow-lg">
            <AlertTriangle className="w-5 h-5" />
            🚨 EMERGENCY DISPATCH ASSIGNMENT
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
            {assignedIncident.title}
          </h1>
          <p className="text-lg font-bold text-red-200 font-mono">
            {assignedIncident.address}
          </p>
        </div>

        {/* Big Mission Card */}
        <div className="bg-black/60 backdrop-blur-md border-2 border-red-500/60 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="flex justify-around border-b border-red-900/60 pb-3 text-sm">
            <div>
              <div className="text-xs text-red-300 font-semibold uppercase">Incident ID</div>
              <div className="text-lg font-black text-white font-mono">{assignedIncident.id}</div>
            </div>
            <div>
              <div className="text-xs text-red-300 font-semibold uppercase">Est. Distance</div>
              <div className="text-lg font-black text-amber-400 font-mono">{assignedIncident.distanceKm} km</div>
            </div>
            <div>
              <div className="text-xs text-red-300 font-semibold uppercase">Response SLA</div>
              <div className="text-lg font-black text-emerald-400 font-mono">~4 MINS</div>
            </div>
          </div>

          <p className="text-xs text-red-200 font-medium">
            High priority response requested by Central Command. All sirens & optical beacons authorized.
          </p>
        </div>

        {/* ONE GIANT ISOLATED ACCEPT MISSION BUTTON (No mis-taps) */}
        <div className="w-full max-w-md mb-6">
          <button
            onClick={() => acceptMission(activeResponder.id)}
            className="w-full h-28 sm:h-32 bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-3xl font-black text-2xl sm:text-3xl shadow-2xl shadow-emerald-950/80 border-4 border-emerald-300 flex items-center justify-center gap-4 transition-all active:scale-[0.97] cursor-pointer animate-pulse"
          >
            <span>🚨 ACCEPT MISSION NOW</span>
          </button>
        </div>

      </div>
    );
  }

  // --- VIEW 3: ACTIVE MISSION NAVIGATION & STATUS PROGRESSION HUD ---
  return (
    <div className="w-full h-full flex flex-col bg-[#05070D] text-slate-100 overflow-hidden relative">
      
      {/* Top Cockpit Telemetry Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🚑</span>
          <div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              {activeResponder.callsign}
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                activeResponder.status === 'offline' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950 text-emerald-400 border border-emerald-700'
              }`}>
                {activeResponder.status.replace('_', ' ')}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Badge: {activeResponder.badgeId} • Crew: {activeResponder.crew[0]}
            </div>
          </div>
        </div>

        {/* Duty Toggle & Telemetry */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeResponder.batteryPercent}%</span>
            <span className="text-slate-600">|</span>
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>{activeResponder.speedKmh} km/h</span>
          </div>

          <button
            onClick={() => toggleDutyStatus(activeResponder.id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono uppercase transition-all cursor-pointer ${
              activeResponder.status === 'offline' 
                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' 
                : 'bg-emerald-600 text-white shadow'
            }`}
          >
            {activeResponder.status === 'offline' ? 'Go On Duty' : 'On Duty'}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {!assignedIncident ? (
        /* IDLE STATE */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-[#070B14]">
          <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-4xl shadow-inner animate-pulse">
            📡
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Waiting for Assignment...</h2>
            <p className="text-xs text-slate-400 max-w-sm">
              Unit {activeResponder.callsign} is actively connected to the Central Dispatch Matrix. Stand by for emergency routing.
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl max-w-xs w-full text-left text-xs text-slate-300 space-y-1 font-mono">
            <div>GPS Coords: {activeResponder.lat.toFixed(4)}, {activeResponder.lng.toFixed(4)}</div>
            <div>Base Sector: Triplicane / Marina Patrol</div>
            <div>Equipment Status: Defibrillator Armed, O2 Normal</div>
          </div>
        </div>
      ) : (
        /* ACTIVE MISSION HUD */
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Turn-by-Turn Navigation Header */}
          <div className="bg-slate-900/95 border-b border-slate-800 p-3 sm:p-4 z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl shadow-lg">
                <Navigation className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isEnRouteToScene && 'Navigation Target: Citizen Incident'}
                  {isOnScene && 'Scene Reached: Patient Triage & Stabilize'}
                  {isTransporting && 'Transit Target: Hospital Emergency Bay'}
                </div>
                <div className="text-base sm:text-lg font-black text-white truncate max-w-xs sm:max-w-md">
                  {isTransporting 
                    ? hospitals.find(h => h.id === assignedIncident.targetHospitalId)?.name || 'Selected Hospital'
                    : assignedIncident.address}
                </div>
              </div>
            </div>

            {/* Huge ETA Display */}
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Live ETA</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                {assignedIncident.etaSeconds <= 0 
                  ? 'ON SCENE' 
                  : `${Math.ceil(assignedIncident.etaSeconds / 60)} MIN`}
              </div>
            </div>
          </div>

          {/* Interactive Map Area */}
          <div className="flex-1 relative min-h-[220px]">
            <TacticalMap
              incidents={[assignedIncident]}
              fleet={[activeResponder]}
              hospitals={hospitals}
              center={[activeResponder.lat, activeResponder.lng]}
              zoom={14}
            />
          </div>

          {/* Tactical Bottom Control Bar */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3 z-20">
            
            {/* Action State Progression */}
            {isEnRouteToScene && (
              <button
                onClick={() => markArrivedOnScene(activeResponder.id)}
                className="w-full h-18 sm:h-20 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-lg sm:text-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
              >
                <MapPin className="w-6 h-6" />
                <span>MARK: ARRIVED ON SCENE</span>
              </button>
            )}

            {isOnScene && (
              <div className="space-y-3">
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-red-300">Triage: Critical Cardiac Patient</div>
                    <div className="text-slate-400">O2 Administered • Defibrillator Synced • IV Line Established</div>
                  </div>
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 font-mono font-bold rounded">
                    CODE RED
                  </span>
                </div>

                <button
                  onClick={() => setShowHospitalModal(true)}
                  className="w-full h-18 sm:h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg sm:text-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <HospIcon className="w-6 h-6" />
                  <span>SELECT CAPACITY-AWARE HOSPITAL</span>
                </button>
              </div>
            )}

            {isTransporting && (
              <button
                onClick={() => markArrivedAtHospital(activeResponder.id)}
                className="w-full h-18 sm:h-20 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg sm:text-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>MARK: ARRIVED AT HOSPITAL TRAUMA BAY</span>
              </button>
            )}

          </div>

        </div>
      )}

      {/* Capacity-Enforced Hospital Selector Modal */}
      {showHospitalModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <HospIcon className="w-5 h-5 text-blue-400" />
                  Smart Capacity-Enforced Routing
                </h3>
                <p className="text-xs text-slate-400">
                  Full ERs are physically locked to prevent ambulance diversion dumping
                </p>
              </div>
              <button
                onClick={() => setShowHospitalModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {/* Hospital Cards List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {hospitals.map(hosp => {
                const isFull = hosp.status === 'full';
                const dist = calculateDistanceKm(activeResponder.lat, activeResponder.lng, hosp.lat, hosp.lng);
                const availBeds = hosp.totalBeds - hosp.occupiedBeds;

                return (
                  <div
                    key={hosp.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isFull 
                        ? 'bg-slate-950/60 border-red-900/40 opacity-60 cursor-not-allowed' 
                        : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 hover:border-emerald-500 shadow-md cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!isFull) {
                        startHospitalTransport(activeResponder.id, hosp.id);
                        setShowHospitalModal(false);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          {hosp.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{hosp.address}</div>
                        <div className="text-[11px] text-cyan-400 mt-1 font-semibold">
                          Specialties: {hosp.specializations.join(', ')}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="text-right shrink-0">
                        {isFull ? (
                          <span className="px-2.5 py-1 rounded-full bg-red-950 border border-red-700 text-red-400 font-bold font-mono text-xs uppercase block">
                            ⛔ ER FULL (LOCKED)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 font-bold font-mono text-xs uppercase block">
                            🟢 {availBeds} BEDS OPEN
                          </span>
                        )}
                        <div className="text-xs font-mono font-bold text-slate-300 mt-1">
                          {dist} km • ETA ~{Math.ceil(dist * 1.4)}m
                        </div>
                      </div>
                    </div>

                    {/* Action button inside card */}
                    <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">ICU Bays: {hosp.icuBedsAvailable}</span>
                      {isFull ? (
                        <span className="text-xs font-bold text-red-500/80">Routing Disabled by Hospital Board</span>
                      ) : (
                        <button
                          onClick={() => {
                            startHospitalTransport(activeResponder.id, hosp.id);
                            setShowHospitalModal(false);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1 cursor-pointer"
                        >
                          <span>Route Here</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowHospitalModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
