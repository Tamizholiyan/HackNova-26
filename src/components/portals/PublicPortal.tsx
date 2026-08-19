import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  Clock, 
  HeartHandshake, 
  AlertTriangle
} from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import type { EmergencyType } from '../../types';
import { MARINA_BEACH_COORDS } from '../../utils/mockData';
import { TacticalMap } from '../maps/TacticalMap';
import { sound } from '../../utils/audioSynth';

export const PublicPortal: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  const { 
    activeIncident, 
    fleet, 
    hospitals, 
    triggerCitizenSos, 
    cancelCitizenSos 
  } = useEmergency();

  const [pressingType, setPressingType] = useState<EmergencyType | null>(null);
  const [pressProgress, setPressProgress] = useState<number>(0);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<'locating' | 'locked'>('locating');

  const progressIntervalRef = useRef<number | null>(null);

  // Auto-Geolocation on load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationStatus('locked');
          },
          () => {
            setLocationStatus('locked');
          },
          { timeout: 3000 }
        );
      } else {
        setLocationStatus('locked');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Handle Hold-to-Confirm SOS
  const startPress = (type: EmergencyType) => {
    sound.playSosPulse();
    setPressingType(type);
    setPressProgress(0);

    const startTime = Date.now();
    const DURATION = 1000; // 1 second hold

    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / DURATION) * 100);
      setPressProgress(progress);

      if (progress >= 100) {
        clearInterval(progressIntervalRef.current!);
        triggerCitizenSos(type, MARINA_BEACH_COORDS.lat, MARINA_BEACH_COORDS.lng, MARINA_BEACH_COORDS.address);
        setPressingType(null);
        setPressProgress(0);
      }
    }, 25);
  };

  const cancelPress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setPressingType(null);
    setPressProgress(0);
  };

  // Find assigned unit for tracking view
  const assignedUnit = activeIncident?.assignedUnitId 
    ? fleet.find(u => u.id === activeIncident.assignedUnitId) 
    : null;

  // Format ETA display
  const formatEta = (seconds: number) => {
    if (seconds <= 0) return 'Arrived on Scene';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center ${isEmbedded ? 'p-2' : 'p-4 sm:p-6'} bg-[#05070D]`}>
      {/* Mobile Device Viewport Mock Frame */}
      <div className={`w-full ${isEmbedded ? 'max-w-full h-full' : 'max-w-md h-[92vh]'} flex flex-col bg-[#0B0F19] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative`}>
        
        {/* Top Status Bar: Location Lock Banner */}
        <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
              {locationStatus === 'locked' ? '📍 GPS Locked: Marina Beach' : '📡 Acquiring GPS...'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded-full">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold text-red-300 uppercase tracking-wide">ZERO LOGIN SOS</span>
          </div>
        </div>

        {/* --- VIEW 1: SOS TRIGGER BUTTONS (IDLE STATE) --- */}
        {!activeIncident || activeIncident.status === 'resolved' || activeIncident.status === 'cancelled' ? (
          <div className="flex-1 flex flex-col justify-between p-5 select-none overflow-y-auto">
            {/* Top Prompt */}
            <div className="text-center my-auto space-y-1">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                Emergency Dispatch
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Tap & hold 1 sec to trigger citywide response
              </p>
            </div>

            {/* 3 Massive Full-Width Emergency Buttons */}
            <div className="space-y-4 my-auto">
              {/* 1. MEDICAL SOS */}
              <div className="relative group">
                <button
                  onMouseDown={() => startPress('medical')}
                  onMouseUp={cancelPress}
                  onMouseLeave={cancelPress}
                  onTouchStart={() => startPress('medical')}
                  onTouchEnd={cancelPress}
                  className="w-full h-28 sm:h-32 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-red-950/40 border-2 border-red-400/40 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-16 h-16 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-inner border border-white/20">
                      🚑
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                        MEDICAL
                      </div>
                      <div className="text-xs font-semibold text-red-100/90 mt-1 uppercase tracking-wider">
                        Ambulance & Paramedics
                      </div>
                    </div>
                  </div>

                  <div className="text-right pr-2">
                    <span className="text-xs font-bold text-red-200 bg-red-900/60 px-2.5 py-1 rounded-full border border-red-400/30">
                      HOLD SOS
                    </span>
                  </div>

                  {/* Hold Progress Fill */}
                  {pressingType === 'medical' && (
                    <div 
                      className="absolute inset-0 bg-white/25 transition-all pointer-events-none"
                      style={{ width: `${pressProgress}%` }}
                    />
                  )}
                </button>
              </div>

              {/* 2. FIRE RESCUE */}
              <div className="relative group">
                <button
                  onMouseDown={() => startPress('fire')}
                  onMouseUp={cancelPress}
                  onMouseLeave={cancelPress}
                  onTouchStart={() => startPress('fire')}
                  onTouchEnd={cancelPress}
                  className="w-full h-24 sm:h-28 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-orange-950/40 border-2 border-orange-400/40 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-14 h-14 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner border border-white/20">
                      🚒
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white tracking-tight leading-none">
                        FIRE RESCUE
                      </div>
                      <div className="text-xs font-semibold text-orange-100/90 mt-1 uppercase tracking-wider">
                        Fire Trucks & Hazmat
                      </div>
                    </div>
                  </div>

                  <div className="text-right pr-2">
                    <span className="text-xs font-bold text-orange-200 bg-orange-900/60 px-2.5 py-1 rounded-full border border-orange-400/30">
                      HOLD SOS
                    </span>
                  </div>

                  {/* Hold Progress Fill */}
                  {pressingType === 'fire' && (
                    <div 
                      className="absolute inset-0 bg-white/25 transition-all pointer-events-none"
                      style={{ width: `${pressProgress}%` }}
                    />
                  )}
                </button>
              </div>

              {/* 3. POLICE EMERGENCY */}
              <div className="relative group">
                <button
                  onMouseDown={() => startPress('police')}
                  onMouseUp={cancelPress}
                  onMouseLeave={cancelPress}
                  onTouchStart={() => startPress('police')}
                  onTouchEnd={cancelPress}
                  className="w-full h-24 sm:h-28 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-blue-950/40 border-2 border-blue-400/40 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-14 h-14 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner border border-white/20">
                      🚓
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white tracking-tight leading-none">
                        POLICE
                      </div>
                      <div className="text-xs font-semibold text-blue-100/90 mt-1 uppercase tracking-wider">
                        Immediate Security Patrol
                      </div>
                    </div>
                  </div>

                  <div className="text-right pr-2">
                    <span className="text-xs font-bold text-blue-200 bg-blue-900/60 px-2.5 py-1 rounded-full border border-blue-400/30">
                      HOLD SOS
                    </span>
                  </div>

                  {/* Hold Progress Fill */}
                  {pressingType === 'police' && (
                    <div 
                      className="absolute inset-0 bg-white/25 transition-all pointer-events-none"
                      style={{ width: `${pressProgress}%` }}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Safeguard Note */}
            <div className="text-center py-2">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Hold button for 1 second to confirm & prevent pocket taps
              </p>
            </div>
          </div>
        ) : (
          /* --- VIEW 2: LIVE TRACKING MODE (POST-SOS ACTIVATION) --- */
          <div className="flex-1 flex flex-col bg-[#080D1A] overflow-hidden relative">
            
            {/* Status Header Banner */}
            <div className={`p-4 ${activeIncident.status === 'pending' ? 'bg-amber-950/70 border-b border-amber-800' : 'bg-red-950/80 border-b border-red-700'} transition-all`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded-full ${activeIncident.status === 'pending' ? 'bg-amber-400 animate-ping' : 'bg-red-500 animate-pulse'}`} />
                  <div>
                    <div className="text-sm font-black text-white uppercase tracking-wide">
                      {activeIncident.status === 'pending' && 'Searching Nearest Unit...'}
                      {activeIncident.status === 'assigned' && 'Responder Assigned'}
                      {activeIncident.status === 'en_route' && 'Unit En Route to You'}
                      {activeIncident.status === 'on_scene' && '🚨 Responder On Scene'}
                      {activeIncident.status === 'transporting' && '🚑 Transporting to Hospital'}
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium truncate max-w-[220px]">
                      {activeIncident.address.split(',')[0]}
                    </div>
                  </div>
                </div>

                {/* Big Live ETA Counter */}
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated ETA</div>
                  <div className="text-xl font-black font-mono text-amber-400 tracking-tight">
                    {formatEta(activeIncident.etaSeconds)}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Interactive Map Area */}
            <div className="flex-1 relative min-h-[220px]">
              <TacticalMap
                incidents={[activeIncident]}
                fleet={assignedUnit ? [assignedUnit] : fleet}
                hospitals={hospitals}
                center={[activeIncident.lat, activeIncident.lng]}
                zoom={14}
                interactive={true}
              />
            </div>

            {/* Assigned Unit Telemetry & Crew Card */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
              {assignedUnit ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/90 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-2xl">
                      🚑
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        {assignedUnit.callsign}
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                          LIVE
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{assignedUnit.driverName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        Speed: {assignedUnit.speedKmh} km/h • Siren: ACTIVE
                      </div>
                    </div>
                  </div>

                  <a
                    href="tel:112"
                    className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
                    title="Direct Responder Hotline"
                  >
                    <PhoneCall className="w-5 h-5" />
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs">
                  <Clock className="w-5 h-5 animate-spin text-amber-400" />
                  <span>Dispatch Command Center is routing the closest unit right now...</span>
                </div>
              )}

              {/* CPR / First Aid Tips card while waiting */}
              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-200 flex items-start gap-2">
                <HeartHandshake className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Emergency Advice:</strong> Stay calm, keep clear access for emergency vehicle, and do not move the patient unless immediate hazard is present.
                </div>
              </div>

              {/* Cancel SOS link for false alarms */}
              <div className="text-center pt-1">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs font-semibold text-slate-400 hover:text-red-400 underline decoration-slate-600 hover:decoration-red-500 transition-colors cursor-pointer"
                >
                  Cancel SOS (False Alarm)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && activeIncident && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cancel Emergency SOS?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure? Responders will be recalled immediately.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Keep Active
                </button>
                <button
                  onClick={() => {
                    cancelCitizenSos(activeIncident.id);
                    setShowCancelModal(false);
                  }}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white cursor-pointer"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
