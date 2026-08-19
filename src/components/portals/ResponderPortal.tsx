import React from 'react';
import { 
  Navigation, 
  CheckCircle2, 
  MapPin, 
  Hospital as HospIcon, 
  Battery, 
  Gauge, 
  AlertTriangle, 
  CornerUpLeft, 
  CornerUpRight, 
  ArrowUp, 
  Compass, 
  MessageSquare 
} from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { StaffHeader } from '../navigation/StaffHeader';
import { TacticalMap } from '../maps/TacticalMap';
import type { NavigationStep } from '../../types';

export const ResponderPortal: React.FC = () => {
  const { 
    fleet, 
    incidents, 
    hospitals, 
    acceptMission, 
    markArrivedOnScene, 
    startHospitalTransport, 
    markArrivedAtHospital, 
    toggleDutyStatus 
  } = useEmergency();

  const { unitId } = useAuth();

  // Active responder unit scoped to logged in user's unitId
  const activeResponder = fleet.find(u => u.id === (unitId || 'unit-1')) || fleet[0];

  // Role-Based Request Filtering: A unit ONLY ever receives missions matching its own type
  const assignedIncident = incidents.find(i => {
    if (i.assignedUnitId !== activeResponder.id || i.status === 'resolved' || i.status === 'cancelled') {
      return false;
    }
    // Safety check
    if (activeResponder.type === 'ambulance' && i.type !== 'medical') return false;
    if (activeResponder.type === 'firetruck' && i.type !== 'fire') return false;
    if (activeResponder.type === 'police_cruiser' && i.type !== 'police') return false;
    return true;
  });

  const isMissionAssigned = assignedIncident && assignedIncident.status === 'assigned';
  const isEnRouteToScene = assignedIncident && assignedIncident.status === 'en_route';
  const isOnScene = assignedIncident && assignedIncident.status === 'on_scene';
  const isTransporting = assignedIncident && assignedIncident.status === 'transporting';

  // Target Hospital info
  const assignedHospital = assignedIncident?.assignedHospitalId
    ? hospitals.find(h => h.id === assignedIncident.assignedHospitalId)
    : null;

  // Active Navigation Step
  const steps: NavigationStep[] = activeResponder.navigationSteps || [];
  const currentStep: NavigationStep | undefined = steps[activeResponder.currentStepIndex || 0] || steps[0];

  const getManeuverIcon = (type?: string) => {
    if (type === 'turn-left') return <CornerUpLeft className="w-6 h-6 text-cyan-400" />;
    if (type === 'turn-right') return <CornerUpRight className="w-6 h-6 text-cyan-400" />;
    if (type === 'arrive') return <MapPin className="w-6 h-6 text-emerald-400" />;
    return <ArrowUp className="w-6 h-6 text-cyan-400" />;
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 dark:bg-[#05070D] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* Staff Header */}
      <StaffHeader 
        title={`Mobile MDT — ${activeResponder.callsign}`}
        roleBadge={`${activeResponder.type.toUpperCase()} MDT`}
        badgeColor="bg-amber-600/20 text-amber-400 border-amber-500/40"
      />

      {/* --- VIEW 1: FULLSCREEN URGENT "ACCEPT MISSION" FLASH ALERT --- */}
      {isMissionAssigned && assignedIncident ? (
        <div className="flex-1 bg-red-950 flex flex-col items-center justify-between p-6 animate-flash-alert select-none overflow-hidden relative border-8 border-red-600">
          
          <div className="text-center space-y-2 mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600 text-white font-black text-sm tracking-widest uppercase animate-bounce shadow-lg">
              <AlertTriangle className="w-5 h-5" />
              🚨 EMERGENCY DISPATCH ASSIGNMENT
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-display">
              {assignedIncident.title}
            </h1>
            <p className="text-lg font-bold text-red-200 font-mono">
              {assignedIncident.address}
            </p>
          </div>

          <div className="bg-black/60 backdrop-blur-md border-2 border-red-500/60 rounded-3xl p-6 max-w-md w-full text-center space-y-3 shadow-2xl">
            <div className="flex justify-around border-b border-red-900/60 pb-3 text-sm">
              <div>
                <div className="text-xs text-red-300 font-semibold uppercase">Incident ID</div>
                <div className="text-lg font-black text-white font-mono">{assignedIncident.id}</div>
              </div>
              <div>
                <div className="text-xs text-red-300 font-semibold uppercase">Severity</div>
                <div className="text-lg font-black text-amber-400 font-mono">{assignedIncident.severity || 'HIGH'}</div>
              </div>
              <div>
                <div className="text-xs text-red-300 font-semibold uppercase">Distance</div>
                <div className="text-lg font-black text-emerald-400 font-mono">{assignedIncident.distanceKm} km</div>
              </div>
            </div>

            {assignedIncident.description && (
              <div className="text-xs text-amber-200 bg-red-950/80 p-2.5 rounded-xl border border-red-800 flex items-start gap-2 text-left">
                <MessageSquare className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span><strong>Citizen Note:</strong> "{assignedIncident.description}"</span>
              </div>
            )}
          </div>

          <div className="w-full max-w-md mb-6">
            <button
              onClick={async () => await acceptMission(activeResponder.id)}
              className="w-full h-28 sm:h-32 bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-3xl font-black text-2xl sm:text-3xl shadow-2xl shadow-emerald-950/80 border-4 border-emerald-300 flex items-center justify-center gap-4 transition-all active:scale-[0.97] cursor-pointer animate-pulse"
            >
              <span>🚨 ACCEPT MISSION NOW</span>
            </button>
          </div>

        </div>
      ) : (
        /* --- VIEW 2: ACTIVE MISSION NAVIGATION HUD OR IDLE STATE --- */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Top MDT Cockpit Bar */}
          <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {activeResponder.type === 'ambulance' ? '🚑' : activeResponder.type === 'firetruck' ? '🚒' : '🚓'}
              </span>
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {activeResponder.callsign}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                    activeResponder.status === 'offline' ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                  }`}>
                    {activeResponder.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Driver: {activeResponder.driverName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <Battery className="w-3.5 h-3.5 text-emerald-500" />
                <span>{activeResponder.batteryPercent}%</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <Gauge className="w-3.5 h-3.5 text-cyan-500" />
                <span>{activeResponder.speedKmh} km/h</span>
              </div>

              <button
                onClick={async () => await toggleDutyStatus(activeResponder.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono uppercase transition-all cursor-pointer ${
                  activeResponder.status === 'offline' 
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400' 
                    : 'bg-emerald-600 text-white shadow'
                }`}
              >
                {activeResponder.status === 'offline' ? 'Go On Duty' : 'On Duty'}
              </button>
            </div>
          </div>

          {!assignedIncident ? (
            /* IDLE STATE */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-50 dark:bg-[#070B14]">
              <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-4xl shadow-inner animate-pulse">
                📡
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">Waiting for Assignment...</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  {activeResponder.callsign} is actively connected to Central Command. System only streams {activeResponder.type.toUpperCase()} calls.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xs w-full text-left text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono">
                <div>GPS: {activeResponder.lat.toFixed(4)}, {activeResponder.lng.toFixed(4)}</div>
                <div>Status: High-Alert Standby Mode</div>
              </div>
            </div>
          ) : (
            /* ACTIVE MISSION TURN-BY-TURN HUD */
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Turn-by-Turn Maneuver Header */}
              <div className="bg-slate-900 dark:bg-slate-950 text-white p-3 sm:p-4 z-10 border-b border-slate-800 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shrink-0">
                    {getManeuverIcon(currentStep?.type)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 animate-spin" />
                      <span>{isEnRouteToScene ? 'LEG 1: EN ROUTE TO SCENE' : 'LEG 2: TRANSIT TO HOSPITAL'}</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white truncate max-w-xs sm:max-w-md font-display">
                      {currentStep?.instruction || (isTransporting ? `Route to ${assignedHospital?.name}` : assignedIncident.address)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Live ETA</div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                    {assignedIncident.etaSeconds <= 0 
                      ? 'ON SCENE' 
                      : `${Math.ceil(assignedIncident.etaSeconds / 60)} MIN`}
                  </div>
                </div>
              </div>

              {/* Navigation Map */}
              <div className="flex-1 relative min-h-[220px]">
                <TacticalMap
                  incidents={[assignedIncident]}
                  fleet={[activeResponder]}
                  hospitals={hospitals}
                  center={[activeResponder.lat, activeResponder.lng]}
                  zoom={14}
                />
              </div>

              {/* Glove-Friendly Tactile Controls */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3 z-20">
                
                {isEnRouteToScene && (
                  <button
                    onClick={async () => await markArrivedOnScene(activeResponder.id)}
                    className="w-full h-18 sm:h-20 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-lg sm:text-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <MapPin className="w-6 h-6" />
                    <span>MARK: ARRIVED ON SCENE</span>
                  </button>
                )}

                {isOnScene && (
                  <div className="space-y-3">
                    {/* Auto-Assigned Confirmed Vacancy Hospital Card */}
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <HospIcon className="w-4 h-4 text-emerald-500" />
                          <span>Auto-Assigned: {assignedHospital?.name || 'Apollo Main Hospital'}</span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                          Confirmed Vacancy • {assignedHospital?.icuBedsAvailable || 14} ICU Bays Ready • No Diversion
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-emerald-600 text-white font-mono font-bold text-[10px] rounded">
                        CONFIRMED ER
                      </span>
                    </div>

                    <button
                      onClick={async () => await startHospitalTransport(activeResponder.id)}
                      className="w-full h-18 sm:h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg sm:text-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Navigation className="w-6 h-6" />
                      <span>PATIENT SECURED / BEGIN HOSPITAL TRANSIT</span>
                    </button>
                  </div>
                )}

                {isTransporting && (
                  <button
                    onClick={async () => await markArrivedAtHospital(activeResponder.id)}
                    className="w-full h-18 sm:h-20 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg sm:text-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span>MARK: ARRIVED AT HOSPITAL TRAUMA BAY</span>
                  </button>
                )}

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
