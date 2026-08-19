import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  PhoneCall, 
  Clock, 
  HeartHandshake, 
  AlertTriangle,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Send,
  X,
  Lock
} from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useTheme } from '../../context/ThemeContext';
import type { EmergencyType, IncidentSeverity } from '../../types';
import { MARINA_BEACH_COORDS } from '../../utils/mockData';
import { TacticalMap } from '../maps/TacticalMap';
import { sound } from '../../utils/audioSynth';

export const PublicPortal: React.FC = () => {
  const { 
    activeCitizenIncident, 
    fleet, 
    hospitals, 
    triggerCitizenSos, 
    updateCitizenIncidentDetails,
    cancelCitizenSos,
    isMuted,
    toggleMute
  } = useEmergency();

  const { theme, toggleTheme } = useTheme();

  const [pressingType, setPressingType] = useState<EmergencyType | null>(null);
  const [pressProgress, setPressProgress] = useState<number>(0);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<'locating' | 'locked'>('locating');

  // Optional Details Card State
  const [showDetailsCard, setShowDetailsCard] = useState<boolean>(true);
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity>('SEVERE');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [detailsSubmitted, setDetailsSubmitted] = useState<boolean>(false);

  const progressIntervalRef = useRef<number | null>(null);

  // Auto-Geolocation on load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => setLocationStatus('locked'),
          () => setLocationStatus('locked'),
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

    progressIntervalRef.current = window.setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / DURATION) * 100);
      setPressProgress(progress);

      if (progress >= 100) {
        clearInterval(progressIntervalRef.current!);
        await triggerCitizenSos(type, MARINA_BEACH_COORDS.lat, MARINA_BEACH_COORDS.lng, MARINA_BEACH_COORDS.address);
        setPressingType(null);
        setPressProgress(0);
        setShowDetailsCard(true);
        setDetailsSubmitted(false);
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

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCitizenIncident) {
      await updateCitizenIncidentDetails(
        activeCitizenIncident.id,
        selectedSeverity,
        descriptionInput.trim() || 'Patient requires urgent on-scene triage.'
      );
      setDetailsSubmitted(true);
      setShowDetailsCard(false);
    }
  };

  // Find assigned unit for tracking view
  const assignedUnit = activeCitizenIncident?.assignedUnitId 
    ? fleet.find(u => u.id === activeCitizenIncident.assignedUnitId) 
    : null;

  // Format ETA display
  const formatEta = (seconds: number) => {
    if (seconds <= 0) return 'Arrived on Scene';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-6 bg-slate-950 dark:bg-[#05070D] text-slate-100 transition-colors">
      
      {/* Top Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between py-1 px-2 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs shadow">
            ⚡
          </div>
          <span className="font-black text-sm text-slate-900 dark:text-white font-display tracking-tight">
            ResQNet SOS
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs"
            title="Toggle Dark / Light Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs"
            title="Sound FX"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Mobile App Frame */}
      <div className="w-full max-w-md h-[84vh] sm:h-[86vh] flex flex-col bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white rounded-3xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden relative transition-colors">
        
        {/* GPS Banner */}
        <div className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800/80 px-4 py-2 flex items-center justify-between z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
              {locationStatus === 'locked' ? '📍 GPS: Marina Beach' : '📡 Acquiring GPS...'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800/60 px-2 py-0.5 rounded-full">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase tracking-wide">ZERO LOGIN SOS</span>
          </div>
        </div>

        {/* --- VIEW 1: SOS TRIGGER BUTTONS (IDLE STATE) --- */}
        {!activeCitizenIncident || activeCitizenIncident.status === 'resolved' || activeCitizenIncident.status === 'cancelled' ? (
          <div className="flex-1 flex flex-col justify-between p-5 select-none overflow-y-auto">
            {/* Prompt */}
            <div className="text-center my-auto space-y-1">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase font-display">
                Emergency Dispatch
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tap & hold 1 sec to trigger citywide response
              </p>
            </div>

            {/* 3 Massive Emergency Buttons */}
            <div className="space-y-4 my-auto">
              {/* 1. MEDICAL SOS */}
              <div className="relative group">
                <button
                  onMouseDown={() => startPress('medical')}
                  onMouseUp={cancelPress}
                  onMouseLeave={cancelPress}
                  onTouchStart={() => startPress('medical')}
                  onTouchEnd={cancelPress}
                  className="w-full h-28 sm:h-32 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-red-950/30 border-2 border-red-400/40 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden text-white"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-16 h-16 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-inner border border-white/20">
                      🚑
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black tracking-tight leading-none font-display">
                        MEDICAL
                      </div>
                      <div className="text-xs font-semibold text-red-100 mt-1 uppercase tracking-wider">
                        Ambulance & Paramedics
                      </div>
                    </div>
                  </div>

                  <div className="text-right pr-2">
                    <span className="text-xs font-bold text-red-200 bg-red-900/60 px-2.5 py-1 rounded-full border border-red-400/30">
                      HOLD SOS
                    </span>
                  </div>

                  {pressingType === 'medical' && (
                    <div 
                      className="absolute inset-0 bg-white/30 transition-all pointer-events-none"
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
                  className="w-full h-24 sm:h-28 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-orange-950/30 border-2 border-orange-400/40 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden text-white"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-14 h-14 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner border border-white/20">
                      🚒
                    </div>
                    <div>
                      <div className="text-2xl font-black tracking-tight leading-none font-display">
                        FIRE RESCUE
                      </div>
                      <div className="text-xs font-semibold text-orange-100 mt-1 uppercase tracking-wider">
                        Fire Trucks & Hazmat
                      </div>
                    </div>
                  </div>

                  <div className="text-right pr-2">
                    <span className="text-xs font-bold text-orange-200 bg-orange-900/60 px-2.5 py-1 rounded-full border border-orange-400/30">
                      HOLD SOS
                    </span>
                  </div>

                  {pressingType === 'fire' && (
                    <div 
                      className="absolute inset-0 bg-white/30 transition-all pointer-events-none"
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
                  className="w-full h-24 sm:h-28 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-blue-950/30 border-2 border-blue-400/40 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden text-white"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-14 h-14 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner border border-white/20">
                      🚓
                    </div>
                    <div>
                      <div className="text-2xl font-black tracking-tight leading-none font-display">
                        POLICE
                      </div>
                      <div className="text-xs font-semibold text-blue-100 mt-1 uppercase tracking-wider">
                        Security Patrol
                      </div>
                    </div>
                  </div>

                  <div className="text-right pr-2">
                    <span className="text-xs font-bold text-blue-200 bg-blue-900/60 px-2.5 py-1 rounded-full border border-blue-400/30">
                      HOLD SOS
                    </span>
                  </div>

                  {pressingType === 'police' && (
                    <div 
                      className="absolute inset-0 bg-white/30 transition-all pointer-events-none"
                      style={{ width: `${pressProgress}%` }}
                    />
                  )}
                </button>
              </div>
            </div>

            <div className="text-center py-2">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Hold button for 1 second to confirm & prevent pocket taps
              </p>
            </div>
          </div>
        ) : (
          /* --- VIEW 2: LIVE TRACKING MODE --- */
          <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#080D1A] overflow-hidden relative">
            
            {/* Status Header Banner */}
            <div className={`p-4 ${activeCitizenIncident.status === 'pending' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'} transition-all`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
                  <div>
                    <div className="text-sm font-black uppercase tracking-wide font-display">
                      {activeCitizenIncident.status === 'pending' && 'Searching Nearest Unit...'}
                      {activeCitizenIncident.status === 'assigned' && 'Responder Assigned'}
                      {activeCitizenIncident.status === 'en_route' && 'Unit En Route to You'}
                      {activeCitizenIncident.status === 'on_scene' && '🚨 Responder On Scene'}
                      {activeCitizenIncident.status === 'transporting' && '🚑 Transporting to Hospital'}
                    </div>
                    <div className="text-[11px] text-red-100 font-medium truncate max-w-[200px]">
                      {activeCitizenIncident.address.split(',')[0]}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-red-200 uppercase">Estimated ETA</div>
                  <div className="text-xl font-black font-mono text-white tracking-tight">
                    {formatEta(activeCitizenIncident.etaSeconds)}
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Details Card (Dismissible / Non-blocking) */}
            {showDetailsCard && !detailsSubmitted && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/70 border-b border-amber-200 dark:border-amber-800 z-10">
                <form onSubmit={handleDetailsSubmit} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                      <span>Add Details (Optional)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDetailsCard(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Severity Selector */}
                  <div className="flex gap-1.5">
                    {(['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'] as const).map(sev => (
                      <button
                        type="button"
                        key={sev}
                        onClick={() => setSelectedSeverity(sev)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          selectedSeverity === sev 
                            ? 'bg-red-600 text-white shadow' 
                            : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>

                  {/* Description Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={descriptionInput}
                      onChange={e => setDescriptionInput(e.target.value)}
                      placeholder="e.g. Chest pain, difficulty breathing..."
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Live Interactive Map */}
            <div className="flex-1 relative min-h-[200px]">
              <TacticalMap
                incidents={[activeCitizenIncident]}
                fleet={assignedUnit ? [assignedUnit] : fleet}
                hospitals={hospitals}
                center={[activeCitizenIncident.lat, activeCitizenIncident.lng]}
                zoom={14}
                interactive={true}
              />
            </div>

            {/* Assigned Unit Telemetry & Crew Card */}
            <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              {assignedUnit ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-600/10 dark:bg-red-600/20 border border-red-500/30 flex items-center justify-center text-xl">
                      🚑
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {assignedUnit.callsign}
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                          LIVE
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{assignedUnit.driverName}</div>
                    </div>
                  </div>

                  <a
                    href="tel:112"
                    className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow transition-transform active:scale-95"
                    title="Direct Responder Hotline"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs">
                  <Clock className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Dispatch Command Center is routing the closest unit right now...</span>
                </div>
              )}

              {/* CPR / First Aid Advice */}
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
                <HeartHandshake className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Emergency Advice:</strong> Stay calm, keep clear access for emergency vehicle, and do not move the patient unless immediate hazard is present.
                </div>
              </div>

              {/* Cancel SOS link */}
              <div className="text-center pt-0.5">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs font-semibold text-slate-400 hover:text-red-500 underline transition-colors cursor-pointer"
                >
                  Cancel SOS (False Alarm)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && activeCitizenIncident && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Cancel Emergency SOS?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Responders will be recalled immediately.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Keep Active
                </button>
                <button
                  onClick={() => {
                    cancelCitizenSos(activeCitizenIncident.id);
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

      {/* Footer with Unobtrusive Staff Login Link */}
      <footer className="w-full max-w-md flex items-center justify-between py-2 text-xs text-slate-500 px-2">
        <span>ResQNet Emergency Network</span>
        <Link
          to="/login"
          className="flex items-center gap-1 text-slate-400 hover:text-white font-medium transition-colors bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded-lg"
        >
          <Lock className="w-3 h-3" />
          <span>Staff Login</span>
        </Link>
      </footer>

    </div>
  );
};
