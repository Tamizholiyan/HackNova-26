import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { 
  Incident, 
  ResponderUnit, 
  Hospital, 
  EmergencyType, 
  PatientVitals, 
  PortalView 
} from '../types';
import { 
  INITIAL_HOSPITALS, 
  INITIAL_FLEET, 
  MARINA_BEACH_COORDS, 
  calculateDistanceKm, 
  generateRoutePoints 
} from '../utils/mockData';
import { sound } from '../utils/audioSynth';

interface EmergencyContextType {
  incidents: Incident[];
  fleet: ResponderUnit[];
  hospitals: Hospital[];
  activeIncident: Incident | null;
  activeResponder: ResponderUnit;
  activeHospital: Hospital;
  currentView: PortalView;
  isMuted: boolean;
  pitchStep: number;
  isPitchPlaying: boolean;
  
  // Actions
  setCurrentView: (view: PortalView) => void;
  setActiveResponderId: (id: string) => void;
  setActiveHospitalId: (id: string) => void;
  toggleMute: () => void;
  
  // Citizen actions
  triggerCitizenSos: (type: EmergencyType, lat?: number, lng?: number, address?: string) => string;
  cancelCitizenSos: (incidentId: string) => void;
  
  // Dispatch actions
  assignResponderToIncident: (incidentId: string, unitId: string) => void;
  
  // Responder actions
  acceptMission: (unitId: string) => void;
  markArrivedOnScene: (unitId: string) => void;
  startHospitalTransport: (unitId: string, hospitalId: string, vitals?: PatientVitals) => void;
  markArrivedAtHospital: (unitId: string) => void;
  toggleDutyStatus: (unitId: string) => void;
  
  // Hospital actions
  toggleHospitalCapacity: (hospitalId: string) => void;
  receivePatientAdmit: (hospitalId: string, incidentId: string) => void;
  
  // Pitch & Story Mode
  setPitchStep: (step: number) => void;
  startGuidedPitch: () => void;
  nextPitchStep: () => void;
  resetToInitialDemo: () => void;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'resqnet_emergency_bus_v1';

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [fleet, setFleet] = useState<ResponderUnit[]>(INITIAL_FLEET);
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [activeResponderId, setActiveResponderId] = useState<string>('unit-1');
  const [activeHospitalId, setActiveHospitalId] = useState<string>('hosp-2'); // Hospital B (Apollo) default
  const [currentView, setCurrentView] = useState<PortalView>('pitch_grid');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [pitchStep, setPitchStep] = useState<number>(0);
  const [isPitchPlaying, setIsPitchPlaying] = useState<boolean>(false);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_SYNC') {
          const { incidents: newInc, fleet: newFleet, hospitals: newHosp } = event.data.payload;
          if (newInc) setIncidents(newInc);
          if (newFleet) setFleet(newFleet);
          if (newHosp) setHospitals(newHosp);
        }
      };
    } catch {
      // BroadcastChannel unsupported fallback
    }

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, []);

  // Broadcast state changes across tabs
  const broadcastState = useCallback((newInc: Incident[], newFleet: ResponderUnit[], newHosp: Hospital[]) => {
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'STATE_SYNC',
          payload: { incidents: newInc, fleet: newFleet, hospitals: newHosp }
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Find active incident for public view
  const activeIncident = incidents.find(inc => inc.status !== 'resolved' && inc.status !== 'cancelled') || null;

  // Active responder unit
  const activeResponder = fleet.find(f => f.id === activeResponderId) || fleet[0];

  // Active hospital
  const activeHospital = hospitals.find(h => h.id === activeHospitalId) || hospitals[0];

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.setMuted(nextMute);
  };

  // --- ACTIONS ---

  // 1. Citizen Triggers SOS
  const triggerCitizenSos = useCallback((
    type: EmergencyType, 
    customLat?: number, 
    customLng?: number, 
    customAddress?: string
  ): string => {
    const newId = `INC-${Date.now().toString().slice(-4)}`;
    const lat = customLat || MARINA_BEACH_COORDS.lat;
    const lng = customLng || MARINA_BEACH_COORDS.lng;
    const address = customAddress || MARINA_BEACH_COORDS.address;

    const titles: Record<EmergencyType, string> = {
      medical: "Critical Medical Emergency (Cardiac/Trauma)",
      fire: "Structural Fire / Rescue Hazard",
      police: "Immediate Police / Security Response"
    };

    const newIncident: Incident = {
      id: newId,
      type,
      title: titles[type],
      description: `Citizen emergency SOS triggered from mobile device near ${address.split(',')[0]}`,
      status: 'pending',
      lat,
      lng,
      address,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      etaSeconds: 240, // 4 mins initial estimate
      distanceKm: 1.2,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          time: Date.now(),
          status: 'pending',
          text: `Citizen triggered ${type.toUpperCase()} SOS at ${address}`,
          actor: 'Citizen'
        }
      ]
    };

    const updatedIncidents = [newIncident, ...incidents];
    setIncidents(updatedIncidents);
    broadcastState(updatedIncidents, fleet, hospitals);

    sound.playEmergencyAlarm();
    return newId;
  }, [incidents, fleet, hospitals, broadcastState]);

  // 2. Citizen Cancels SOS
  const cancelCitizenSos = useCallback((incidentId: string) => {
    const updatedIncidents = incidents.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: 'cancelled' as const,
          updatedAt: Date.now(),
          timeline: [
            ...inc.timeline,
            {
              id: `tl-${Date.now()}`,
              time: Date.now(),
              status: 'cancelled' as const,
              text: 'Citizen cancelled alarm (False Alarm reported)',
              actor: 'Citizen' as const
            }
          ]
        };
      }
      return inc;
    });

    // If unit was assigned, free it
    const cancelledInc = incidents.find(i => i.id === incidentId);
    let updatedFleet = fleet;
    if (cancelledInc && cancelledInc.assignedUnitId) {
      updatedFleet = fleet.map(u => 
        u.id === cancelledInc.assignedUnitId ? { ...u, status: 'available' as const, currentIncidentId: undefined } : u
      );
      setFleet(updatedFleet);
    }

    setIncidents(updatedIncidents);
    broadcastState(updatedIncidents, updatedFleet, hospitals);
    sound.playTactileClick();
  }, [incidents, fleet, hospitals, broadcastState]);

  // 3. Dispatch Center Assigns Responder
  const assignResponderToIncident = useCallback((incidentId: string, unitId: string) => {
    const unit = fleet.find(u => u.id === unitId);
    const incident = incidents.find(i => i.id === incidentId);
    if (!unit || !incident) return;

    const dist = calculateDistanceKm(unit.lat, unit.lng, incident.lat, incident.lng);
    const calculatedEta = Math.max(90, Math.round((dist / 40) * 3600)); // ~40km/h city speed

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: 'assigned' as const,
          assignedUnitId: unitId,
          distanceKm: dist,
          etaSeconds: calculatedEta,
          updatedAt: Date.now(),
          timeline: [
            ...inc.timeline,
            {
              id: `tl-${Date.now()}`,
              time: Date.now(),
              status: 'assigned' as const,
              text: `Dispatch assigned ${unit.callsign} (${dist} km away, ETA ~${Math.ceil(calculatedEta/60)} mins)`,
              actor: 'Dispatch' as const
            }
          ]
        };
      }
      return inc;
    });

    const updatedFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          status: 'dispatched' as const,
          currentIncidentId: incidentId
        };
      }
      return u;
    });

    setIncidents(updatedIncidents);
    setFleet(updatedFleet);
    broadcastState(updatedIncidents, updatedFleet, hospitals);
    sound.playEmergencyAlarm();
  }, [incidents, fleet, hospitals, broadcastState]);

  // 4. Responder Accepts Mission
  const acceptMission = useCallback((unitId: string) => {
    const unit = fleet.find(u => u.id === unitId);
    if (!unit || !unit.currentIncidentId) return;

    const incident = incidents.find(i => i.id === unit.currentIncidentId);
    if (!incident) return;

    // Generate driving route from unit location to incident location
    const route = generateRoutePoints([unit.lat, unit.lng], [incident.lat, incident.lng], 30);

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === unit.currentIncidentId) {
        return {
          ...inc,
          status: 'en_route' as const,
          updatedAt: Date.now(),
          timeline: [
            ...inc.timeline,
            {
              id: `tl-${Date.now()}`,
              time: Date.now(),
              status: 'en_route' as const,
              text: `${unit.callsign} crew accepted mission and is En Route with sirens active`,
              actor: 'Responder' as const
            }
          ]
        };
      }
      return inc;
    });

    const updatedFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          status: 'en_route' as const,
          speedKmh: 58,
          routeCoords: route,
          routeIndex: 0
        };
      }
      return u;
    });

    setIncidents(updatedIncidents);
    setFleet(updatedFleet);
    broadcastState(updatedIncidents, updatedFleet, hospitals);
    sound.playTactileClick();
  }, [fleet, incidents, hospitals, broadcastState]);

  // 5. Responder Marks "Arrived on Scene"
  const markArrivedOnScene = useCallback((unitId: string) => {
    const unit = fleet.find(u => u.id === unitId);
    if (!unit || !unit.currentIncidentId) return;

    const incident = incidents.find(i => i.id === unit.currentIncidentId);
    if (!incident) return;

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === unit.currentIncidentId) {
        return {
          ...inc,
          status: 'on_scene' as const,
          etaSeconds: 0,
          updatedAt: Date.now(),
          patientVitals: {
            condition: "Acute Myocardial Infarction / Chest Pain",
            severity: "CRITICAL" as const,
            bloodPressure: "155/95",
            heartRate: 112,
            oxygenSat: 92,
            notes: "Oxygen administered, IV line established. Immediate cardiac intervention required."
          },
          timeline: [
            ...inc.timeline,
            {
              id: `tl-${Date.now()}`,
              time: Date.now(),
              status: 'on_scene' as const,
              text: `${unit.callsign} arrived on scene. Paramedics assessing & stabilizing patient.`,
              actor: 'Responder' as const
            }
          ]
        };
      }
      return inc;
    });

    const updatedFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          status: 'on_scene' as const,
          speedKmh: 0,
          lat: incident.lat,
          lng: incident.lng,
          routeCoords: undefined,
          routeIndex: 0
        };
      }
      return u;
    });

    setIncidents(updatedIncidents);
    setFleet(updatedFleet);
    broadcastState(updatedIncidents, updatedFleet, hospitals);
    sound.playTactileClick();
  }, [fleet, incidents, hospitals, broadcastState]);

  // 6. Responder Starts Hospital Transport
  const startHospitalTransport = useCallback((unitId: string, hospitalId: string, customVitals?: PatientVitals) => {
    const unit = fleet.find(u => u.id === unitId);
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!unit || !unit.currentIncidentId || !hospital) return;

    const incident = incidents.find(i => i.id === unit.currentIncidentId);
    if (!incident) return;

    const distToHosp = calculateDistanceKm(unit.lat, unit.lng, hospital.lat, hospital.lng);
    const etaToHospSec = Math.round((distToHosp / 45) * 3600); // 45km/h priority ambulance speed (~8 mins)
    const route = generateRoutePoints([unit.lat, unit.lng], [hospital.lat, hospital.lng], 35);

    const vitals = customVitals || incident.patientVitals || {
      condition: "Cardiac Patient - High Priority",
      severity: "CRITICAL" as const,
      bloodPressure: "150/92",
      heartRate: 108,
      oxygenSat: 94,
      notes: "Direct transit to Cath Lab requested."
    };

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === unit.currentIncidentId) {
        return {
          ...inc,
          status: 'transporting' as const,
          targetHospitalId: hospitalId,
          distanceKm: distToHosp,
          etaSeconds: etaToHospSec,
          patientVitals: vitals,
          updatedAt: Date.now(),
          timeline: [
            ...inc.timeline,
            {
              id: `tl-${Date.now()}`,
              time: Date.now(),
              status: 'transporting' as const,
              text: `Transporting patient to ${hospital.name}. Live inbound alert broadcast to ER team. (ETA: ${Math.ceil(etaToHospSec/60)} mins)`,
              actor: 'Responder' as const
            }
          ]
        };
      }
      return inc;
    });

    const updatedFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          status: 'transporting' as const,
          targetHospitalId: hospitalId,
          speedKmh: 64,
          routeCoords: route,
          routeIndex: 0
        };
      }
      return u;
    });

    setIncidents(updatedIncidents);
    setFleet(updatedFleet);
    broadcastState(updatedIncidents, updatedFleet, hospitals);

    // ER Monitor chime
    sound.playHospitalChime();
  }, [fleet, hospitals, incidents, broadcastState]);

  // 7. Responder Marks "Arrived at Hospital"
  const markArrivedAtHospital = useCallback((unitId: string) => {
    const unit = fleet.find(u => u.id === unitId);
    if (!unit || !unit.currentIncidentId || !unit.targetHospitalId) return;

    const hospital = hospitals.find(h => h.id === unit.targetHospitalId);
    if (!hospital) return;

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === unit.currentIncidentId) {
        return {
          ...inc,
          etaSeconds: 0,
          updatedAt: Date.now(),
          timeline: [
            ...inc.timeline,
            {
              id: `tl-${Date.now()}`,
              time: Date.now(),
              status: inc.status,
              text: `${unit.callsign} pulled into ${hospital.name} Trauma Bay. Transferring patient.`,
              actor: 'Responder' as const
            }
          ]
        };
      }
      return inc;
    });

    const updatedFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          speedKmh: 0,
          lat: hospital.lat,
          lng: hospital.lng,
          routeCoords: undefined,
          routeIndex: 0
        };
      }
      return u;
    });

    setIncidents(updatedIncidents);
    setFleet(updatedFleet);
    broadcastState(updatedIncidents, updatedFleet, hospitals);
    sound.playHospitalChime();
  }, [fleet, hospitals, incidents, broadcastState]);

  // 8. Hospital Toggles ER Capacity (Accepting <-> Full)
  const toggleHospitalCapacity = useCallback((hospitalId: string) => {
    const updatedHospitals = hospitals.map(h => {
      if (h.id === hospitalId) {
        const nextStatus = h.status === 'accepting' ? ('full' as const) : ('accepting' as const);
        return {
          ...h,
          status: nextStatus,
          occupiedBeds: nextStatus === 'full' ? h.totalBeds : Math.round(h.totalBeds * 0.75),
          icuBedsAvailable: nextStatus === 'full' ? 0 : 5
        };
      }
      return h;
    });

    setHospitals(updatedHospitals);
    broadcastState(incidents, fleet, updatedHospitals);
    sound.playTactileClick();
  }, [hospitals, incidents, fleet, broadcastState]);

  // 9. Hospital Receives Patient & Closes Loop
  const receivePatientAdmit = useCallback((hospitalId: string, incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId);
    const assignedUnitId = incident?.assignedUnitId;

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: 'resolved' as const,
          etaSeconds: 0,
          updatedAt: Date.now(),
          timeline: [
            ...inc.timeline,
            {
              id: `tl-${Date.now()}`,
              time: Date.now(),
              status: 'resolved' as const,
              text: `Patient admitted to Emergency ICU. Emergency resolved successfully.`,
              actor: 'Hospital' as const
            }
          ]
        };
      }
      return inc;
    });

    // Free the responder unit back to available at hospital location
    const updatedFleet = fleet.map(u => {
      if (u.id === assignedUnitId) {
        return {
          ...u,
          status: 'available' as const,
          currentIncidentId: undefined,
          targetHospitalId: undefined,
          speedKmh: 0,
          routeCoords: undefined,
          routeIndex: 0
        };
      }
      return u;
    });

    // Increase hospital occupied beds
    const updatedHospitals = hospitals.map(h => {
      if (h.id === hospitalId) {
        return {
          ...h,
          occupiedBeds: Math.min(h.totalBeds, h.occupiedBeds + 1),
          icuBedsAvailable: Math.max(0, h.icuBedsAvailable - 1)
        };
      }
      return h;
    });

    setIncidents(updatedIncidents);
    setFleet(updatedFleet);
    setHospitals(updatedHospitals);
    broadcastState(updatedIncidents, updatedFleet, updatedHospitals);

    sound.playSuccessChime();
  }, [incidents, fleet, hospitals, broadcastState]);

  // Toggle Responder Duty
  const toggleDutyStatus = useCallback((unitId: string) => {
    const updatedFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          status: u.status === 'offline' ? ('available' as const) : ('offline' as const)
        };
      }
      return u;
    });
    setFleet(updatedFleet);
    broadcastState(incidents, updatedFleet, hospitals);
    sound.playTactileClick();
  }, [fleet, incidents, hospitals, broadcastState]);

  // Simulation Tick Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setFleet(prevFleet => {
        let hasChanges = false;
        const nextFleet = prevFleet.map(unit => {
          if ((unit.status === 'en_route' || unit.status === 'transporting') && unit.routeCoords && unit.routeCoords.length > 0) {
            const currentIndex = unit.routeIndex || 0;
            if (currentIndex < unit.routeCoords.length - 1) {
              hasChanges = true;
              const nextIndex = currentIndex + 1;
              const [nextLat, nextLng] = unit.routeCoords[nextIndex];
              const prevPoint = unit.routeCoords[currentIndex];
              
              const dLat = nextLat - prevPoint[0];
              const dLng = nextLng - prevPoint[1];
              const heading = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

              return {
                ...unit,
                lat: nextLat,
                lng: nextLng,
                heading,
                routeIndex: nextIndex
              };
            }
          }
          return unit;
        });

        return hasChanges ? nextFleet : prevFleet;
      });

      // Decrement ETA seconds for active incidents
      setIncidents(prevInc => {
        let hasChanges = false;
        const nextInc = prevInc.map(inc => {
          if ((inc.status === 'assigned' || inc.status === 'en_route' || inc.status === 'transporting') && inc.etaSeconds > 0) {
            hasChanges = true;
            return {
              ...inc,
              etaSeconds: Math.max(0, inc.etaSeconds - 2)
            };
          }
          return inc;
        });
        return hasChanges ? nextInc : prevInc;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reset Simulation
  const resetToInitialDemo = useCallback(() => {
    setIncidents([]);
    setFleet(INITIAL_FLEET);
    setHospitals(INITIAL_HOSPITALS);
    setPitchStep(0);
    setIsPitchPlaying(false);
    broadcastState([], INITIAL_FLEET, INITIAL_HOSPITALS);
    sound.playTactileClick();
  }, [broadcastState]);

  const executePitchStep = useCallback((step: number) => {
    switch (step) {
      case 1:
        triggerCitizenSos('medical', MARINA_BEACH_COORDS.lat, MARINA_BEACH_COORDS.lng, MARINA_BEACH_COORDS.address);
        break;
      case 2:
        if (incidents.length > 0) {
          assignResponderToIncident(incidents[0].id, 'unit-1');
        } else {
          const incId = triggerCitizenSos('medical', MARINA_BEACH_COORDS.lat, MARINA_BEACH_COORDS.lng, MARINA_BEACH_COORDS.address);
          setTimeout(() => assignResponderToIncident(incId, 'unit-1'), 300);
        }
        break;
      case 3:
        acceptMission('unit-1');
        break;
      case 4:
        markArrivedOnScene('unit-1');
        setTimeout(() => {
          startHospitalTransport('unit-1', 'hosp-2');
        }, 1200);
        break;
      case 5:
        markArrivedAtHospital('unit-1');
        break;
      case 6:
        {
          const activeInc = incidents.find(i => i.status !== 'resolved' && i.status !== 'cancelled');
          if (activeInc) {
            receivePatientAdmit('hosp-2', activeInc.id);
          }
        }
        break;
      default:
        break;
    }
  }, [incidents, triggerCitizenSos, assignResponderToIncident, acceptMission, markArrivedOnScene, startHospitalTransport, markArrivedAtHospital, receivePatientAdmit]);

  const nextPitchStep = useCallback(() => {
    setPitchStep(prev => {
      const next = prev + 1;
      executePitchStep(next);
      return next;
    });
  }, [executePitchStep]);

  const startGuidedPitch = useCallback(() => {
    resetToInitialDemo();
    setPitchStep(1);
    setIsPitchPlaying(true);
    setTimeout(() => {
      executePitchStep(1);
    }, 200);
  }, [resetToInitialDemo, executePitchStep]);

  return (
    <EmergencyContext.Provider
      value={{
        incidents,
        fleet,
        hospitals,
        activeIncident,
        activeResponder,
        activeHospital,
        currentView,
        isMuted,
        pitchStep,
        isPitchPlaying,
        setCurrentView,
        setActiveResponderId,
        setActiveHospitalId,
        toggleMute,
        triggerCitizenSos,
        cancelCitizenSos,
        assignResponderToIncident,
        acceptMission,
        markArrivedOnScene,
        startHospitalTransport,
        markArrivedAtHospital,
        toggleDutyStatus,
        toggleHospitalCapacity,
        receivePatientAdmit,
        setPitchStep,
        startGuidedPitch,
        nextPitchStep,
        resetToInitialDemo
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
