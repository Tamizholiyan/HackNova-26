import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { 
  Incident, 
  ResponderUnit, 
  Hospital, 
  EmergencyType, 
  IncidentSeverity,
  PatientVitals 
} from '../types';
import { 
  INITIAL_HOSPITALS, 
  INITIAL_FLEET, 
  MARINA_BEACH_COORDS, 
  calculateDistanceKm 
} from '../utils/mockData';
import { calculateTurnByTurnRoute } from '../utils/routingEngine';
import { sound } from '../utils/audioSynth';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface EmergencyContextType {
  incidents: Incident[];
  fleet: ResponderUnit[];
  hospitals: Hospital[];
  activeCitizenIncident: Incident | null;
  isMuted: boolean;
  
  // Actions
  toggleMute: () => void;
  
  // Citizen actions
  triggerCitizenSos: (type: EmergencyType, lat?: number, lng?: number, address?: string) => Promise<string>;
  updateCitizenIncidentDetails: (incidentId: string, severity: IncidentSeverity, description: string) => Promise<void>;
  cancelCitizenSos: (incidentId: string) => Promise<void>;
  
  // Dispatch actions
  assignResponderToIncident: (incidentId: string, unitId: string) => Promise<void>;
  overrideAssignedHospital: (incidentId: string, hospitalId: string) => Promise<void>;
  
  // Responder actions
  acceptMission: (unitId: string) => Promise<void>;
  markArrivedOnScene: (unitId: string) => Promise<void>;
  startHospitalTransport: (unitId: string, vitals?: PatientVitals) => Promise<void>;
  markArrivedAtHospital: (unitId: string) => Promise<void>;
  toggleDutyStatus: (unitId: string) => Promise<void>;
  
  // Hospital actions
  toggleHospitalCapacity: (hospitalId: string) => Promise<void>;
  receivePatientAdmit: (hospitalId: string, incidentId: string) => Promise<void>;
  
  // Reset
  resetData: () => Promise<void>;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'resqnet_emergency_bus_v2';

// Intelligent Auto-Hospital Assignment Algorithm
export function findBestHospital(
  incType: EmergencyType,
  severity: IncidentSeverity | undefined,
  incLat: number,
  incLng: number,
  hospitalsList: Hospital[]
): Hospital | null {
  const acceptingHospitals = hospitalsList.filter(h => h.status === 'accepting' && (h.totalBeds - h.occupiedBeds) > 0);
  if (acceptingHospitals.length === 0) {
    // If all are full, pick hospital with least occupancy as emergency overflow
    return hospitalsList[0] || null;
  }

  // Score hospitals based on specialization, distance, and capacity
  const scored = acceptingHospitals.map(h => {
    let specScore = 0;
    const specializations = h.specializations.map(s => s.toLowerCase());

    if (incType === 'medical') {
      if (severity === 'CRITICAL' || severity === 'SEVERE') {
        if (specializations.some(s => s.includes('cardiac') || s.includes('trauma') || s.includes('critical'))) {
          specScore += 15;
        }
      } else {
        if (specializations.some(s => s.includes('general') || s.includes('emergency'))) {
          specScore += 5;
        }
      }
    } else if (incType === 'fire') {
      if (specializations.some(s => s.includes('burn') || s.includes('trauma'))) {
        specScore += 15;
      }
    }

    const dist = calculateDistanceKm(incLat, incLng, h.lat, h.lng);
    const distancePenalty = dist * 2; // closer is better
    const availableBeds = h.totalBeds - h.occupiedBeds;
    const capacityBonus = Math.min(10, availableBeds / 10);

    const totalScore = specScore + capacityBonus - distancePenalty;

    return { hospital: h, score: totalScore, distance: dist };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.hospital || acceptingHospitals[0];
}

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem('resqnet_incidents_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [fleet, setFleet] = useState<ResponderUnit[]>(() => {
    const saved = localStorage.getItem('resqnet_fleet_v2');
    return saved ? JSON.parse(saved) : INITIAL_FLEET;
  });
  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    const saved = localStorage.getItem('resqnet_hospitals_v2');
    return saved ? JSON.parse(saved) : INITIAL_HOSPITALS;
  });

  const [activeCitizenIncidentId, setActiveCitizenIncidentId] = useState<string | null>(() => {
    return localStorage.getItem('resqnet_active_citizen_inc_id');
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Sync to local storage for instant responsiveness
  useEffect(() => {
    localStorage.setItem('resqnet_incidents_v2', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('resqnet_fleet_v2', JSON.stringify(fleet));
  }, [fleet]);

  useEffect(() => {
    localStorage.setItem('resqnet_hospitals_v2', JSON.stringify(hospitals));
  }, [hospitals]);

  // BroadcastChannel for cross-tab realtime sync
  useEffect(() => {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_ALL') {
          const { incidents: newInc, fleet: newFleet, hospitals: newHosp } = event.data.payload;
          if (newInc) setIncidents(newInc);
          if (newFleet) setFleet(newFleet);
          if (newHosp) setHospitals(newHosp);
        }
      };
    } catch {
      // safe fallback
    }

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, []);

  const broadcastAll = useCallback((newInc: Incident[], newFleet: ResponderUnit[], newHosp: Hospital[]) => {
    try {
      broadcastChannelRef.current?.postMessage({
        type: 'SYNC_ALL',
        payload: { incidents: newInc, fleet: newFleet, hospitals: newHosp }
      });
    } catch {
      // safe fallback
    }
  }, []);

  // Supabase Realtime Subscription if configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      // Fetch initial data from Supabase
      supabase.from('hospitals').select('*').then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: Hospital[] = data.map((h: any) => ({
            id: h.id,
            name: h.name,
            shortCode: h.short_code || h.name.slice(0, 8),
            status: h.status,
            totalBeds: h.total_beds,
            occupiedBeds: h.occupied_beds,
            icuBedsAvailable: h.icu_beds_available,
            specializations: h.specializations || [],
            lat: h.lat,
            lng: h.lng,
            address: h.address || '',
            phone: h.phone || '',
          }));
          setHospitals(mapped);
        }
      });

      supabase.from('units').select('*').then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: ResponderUnit[] = data.map((u: any) => ({
            id: u.id,
            callsign: u.callsign,
            type: u.type === 'ambulance' ? 'ambulance' : u.type === 'fire' ? 'firetruck' : 'police_cruiser',
            status: u.status,
            badgeId: u.callsign,
            driverName: u.crew || 'Duty Crew',
            lat: u.lat,
            lng: u.lng,
            heading: 0,
            speedKmh: u.speed_kmh || 0,
            batteryPercent: u.battery_percent || 95,
            crew: [u.crew || 'Lead Operator'],
          }));
          setFleet(mapped);
        }
      });

      supabase.from('incidents').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        if (data) {
          const mapped: Incident[] = data.map((i: any) => ({
            id: i.id,
            type: i.type,
            title: i.title,
            description: i.description || undefined,
            severity: i.severity || undefined,
            status: i.status,
            lat: i.lat,
            lng: i.lng,
            address: i.address_label || 'Emergency Location',
            createdAt: new Date(i.created_at).getTime(),
            updatedAt: new Date(i.updated_at).getTime(),
            citizenToken: i.citizen_token,
            assignedUnitId: i.assigned_unit_id,
            assignedHospitalId: i.assigned_hospital_id,
            etaSeconds: i.eta_seconds || 240,
            distanceKm: i.distance_km || 1.2,
            timeline: []
          }));
          setIncidents(mapped);
        }
      });

      // Realtime channel
      const channel = supabase
        .channel('resqnet_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new;
            const inc: Incident = {
              id: newRow.id,
              type: newRow.type,
              title: newRow.title,
              description: newRow.description,
              severity: newRow.severity,
              status: newRow.status,
              lat: newRow.lat,
              lng: newRow.lng,
              address: newRow.address_label || 'Emergency Location',
              createdAt: new Date(newRow.created_at).getTime(),
              updatedAt: new Date(newRow.updated_at).getTime(),
              citizenToken: newRow.citizen_token,
              assignedUnitId: newRow.assigned_unit_id,
              assignedHospitalId: newRow.assigned_hospital_id,
              etaSeconds: newRow.eta_seconds || 240,
              distanceKm: newRow.distance_km || 1.2,
              timeline: []
            };
            setIncidents(prev => [inc, ...prev.filter(x => x.id !== inc.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const upd = payload.new;
            setIncidents(prev => prev.map(x => (x.id === upd.id ? {
              ...x,
              status: upd.status,
              severity: upd.severity,
              description: upd.description,
              assignedUnitId: upd.assigned_unit_id,
              assignedHospitalId: upd.assigned_hospital_id,
              etaSeconds: upd.eta_seconds || x.etaSeconds,
            } : x)));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, (payload: any) => {
          if (payload.eventType === 'UPDATE') {
            const upd = payload.new;
            setFleet(prev => prev.map(u => (u.id === upd.id ? {
              ...u,
              status: upd.status,
              lat: upd.lat ?? u.lat,
              lng: upd.lng ?? u.lng,
            } : u)));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals' }, (payload: any) => {
          if (payload.eventType === 'UPDATE') {
            const upd = payload.new;
            setHospitals(prev => prev.map(h => (h.id === upd.id ? {
              ...h,
              status: upd.status,
              occupiedBeds: upd.occupied_beds ?? h.occupiedBeds,
            } : h)));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const activeCitizenIncident = activeCitizenIncidentId
    ? incidents.find(i => i.id === activeCitizenIncidentId && i.status !== 'resolved' && i.status !== 'cancelled') || null
    : null;

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  // 1. Citizen Triggers SOS
  const triggerCitizenSos = useCallback(async (
    type: EmergencyType,
    lat: number = MARINA_BEACH_COORDS.lat,
    lng: number = MARINA_BEACH_COORDS.lng,
    address: string = MARINA_BEACH_COORDS.address
  ): Promise<string> => {
    const newId = `INC-${Date.now().toString().slice(-4)}`;
    
    // Auto-assign best hospital immediately for medical emergencies
    const autoHospital = type === 'medical' ? findBestHospital(type, undefined, lat, lng, hospitals) : null;

    const titles: Record<EmergencyType, string> = {
      medical: "Critical Medical Emergency",
      fire: "Structural Fire / Hazard Alert",
      police: "Security / Police Emergency"
    };

    const newIncident: Incident = {
      id: newId,
      type,
      title: titles[type],
      status: 'pending',
      lat,
      lng,
      address,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      assignedHospitalId: autoHospital?.id,
      etaSeconds: 240,
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

    const nextIncidents = [newIncident, ...incidents];
    setIncidents(nextIncidents);
    setActiveCitizenIncidentId(newId);
    localStorage.setItem('resqnet_active_citizen_inc_id', newId);
    broadcastAll(nextIncidents, fleet, hospitals);
    sound.playEmergencyAlarm();

    // Supabase insert if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('incidents').insert({
          type,
          title: titles[type],
          status: 'pending',
          lat,
          lng,
          address_label: address,
          assigned_hospital_id: autoHospital?.id,
          eta_seconds: 240,
          distance_km: 1.2
        });
      } catch (err) {
        console.error('Supabase incident insert error:', err);
      }
    }

    return newId;
  }, [incidents, fleet, hospitals, broadcastAll]);

  // 2. Citizen Updates Optional Details (Severity & Description)
  const updateCitizenIncidentDetails = useCallback(async (
    incidentId: string,
    severity: IncidentSeverity,
    description: string
  ) => {
    const targetInc = incidents.find(i => i.id === incidentId);
    const autoHospital = targetInc && targetInc.type === 'medical'
      ? findBestHospital(targetInc.type, severity, targetInc.lat, targetInc.lng, hospitals)
      : null;

    const nextIncidents = incidents.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          severity,
          description,
          assignedHospitalId: autoHospital ? autoHospital.id : inc.assignedHospitalId,
          updatedAt: Date.now(),
          timeline: [
            ...inc.timeline,
            {
              id: `tl-${Date.now()}`,
              time: Date.now(),
              status: inc.status,
              text: `Citizen provided details: Severity ${severity} • "${description}"`,
              actor: 'Citizen' as const
            }
          ]
        };
      }
      return inc;
    });

    setIncidents(nextIncidents);
    broadcastAll(nextIncidents, fleet, hospitals);
    sound.playTactileClick();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('incidents').update({
          severity,
          description,
          assigned_hospital_id: autoHospital ? autoHospital.id : undefined,
          updated_at: new Date().toISOString()
        }).eq('id', incidentId);
      } catch (err) {
        console.error('Supabase incident update error:', err);
      }
    }
  }, [incidents, fleet, hospitals, broadcastAll]);

  // 3. Citizen Cancels SOS
  const cancelCitizenSos = useCallback(async (incidentId: string) => {
    const nextIncidents = incidents.map(inc => {
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
              text: 'Citizen cancelled SOS (False Alarm reported)',
              actor: 'Citizen' as const
            }
          ]
        };
      }
      return inc;
    });

    // Free assigned responder unit
    const cancelled = incidents.find(i => i.id === incidentId);
    let nextFleet = fleet;
    if (cancelled?.assignedUnitId) {
      nextFleet = fleet.map(u => 
        u.id === cancelled.assignedUnitId ? { ...u, status: 'available' as const, currentIncidentId: undefined } : u
      );
      setFleet(nextFleet);
    }

    setIncidents(nextIncidents);
    setActiveCitizenIncidentId(null);
    localStorage.removeItem('resqnet_active_citizen_inc_id');
    broadcastAll(nextIncidents, nextFleet, hospitals);
    sound.playTactileClick();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('incidents').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', incidentId);
        if (cancelled?.assignedUnitId) {
          await supabase.from('units').update({ status: 'available', updated_at: new Date().toISOString() }).eq('id', cancelled.assignedUnitId);
        }
      } catch (err) {
        console.error('Supabase cancel error:', err);
      }
    }
  }, [incidents, fleet, hospitals, broadcastAll]);

  // 4. Dispatcher Assigns Unit
  const assignResponderToIncident = useCallback(async (incidentId: string, unitId: string) => {
    const unit = fleet.find(u => u.id === unitId);
    const incident = incidents.find(i => i.id === incidentId);
    if (!unit || !incident) return;

    // Ensure type safety: unit matches incident type
    const isMatched = 
      (incident.type === 'medical' && unit.type === 'ambulance') ||
      (incident.type === 'fire' && unit.type === 'firetruck') ||
      (incident.type === 'police' && unit.type === 'police_cruiser');

    if (!isMatched) {
      console.warn(`Unit ${unit.callsign} (${unit.type}) does not match incident type ${incident.type}`);
    }

    const dist = calculateDistanceKm(unit.lat, unit.lng, incident.lat, incident.lng);
    const calculatedEta = Math.max(90, Math.round((dist / 40) * 3600));

    // Auto-hospital check
    const autoHospital = incident.assignedHospitalId 
      ? hospitals.find(h => h.id === incident.assignedHospitalId)
      : findBestHospital(incident.type, incident.severity, incident.lat, incident.lng, hospitals);

    const nextIncidents = incidents.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: 'assigned' as const,
          assignedUnitId: unitId,
          assignedHospitalId: autoHospital?.id || inc.assignedHospitalId,
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

    const nextFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          status: 'dispatched' as const,
          currentIncidentId: incidentId,
          assignedHospitalId: autoHospital?.id
        };
      }
      return u;
    });

    setIncidents(nextIncidents);
    setFleet(nextFleet);
    broadcastAll(nextIncidents, nextFleet, hospitals);
    sound.playEmergencyAlarm();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('incidents').update({
          status: 'assigned',
          assigned_unit_id: unitId,
          assigned_hospital_id: autoHospital?.id,
          eta_seconds: calculatedEta,
          distance_km: dist,
          updated_at: new Date().toISOString()
        }).eq('id', incidentId);

        await supabase.from('units').update({
          status: 'dispatched',
          updated_at: new Date().toISOString()
        }).eq('id', unitId);
      } catch (err) {
        console.error('Supabase assign error:', err);
      }
    }
  }, [incidents, fleet, hospitals, broadcastAll]);

  // Dispatch Manual Hospital Override
  const overrideAssignedHospital = useCallback(async (incidentId: string, hospitalId: string) => {
    const nextIncidents = incidents.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          assignedHospitalId: hospitalId,
          updatedAt: Date.now()
        };
      }
      return inc;
    });

    const nextFleet = fleet.map(u => {
      if (u.currentIncidentId === incidentId) {
        return {
          ...u,
          assignedHospitalId: hospitalId
        };
      }
      return u;
    });

    setIncidents(nextIncidents);
    setFleet(nextFleet);
    broadcastAll(nextIncidents, nextFleet, hospitals);
    sound.playTactileClick();
  }, [incidents, fleet, hospitals, broadcastAll]);

  // 5. Responder Accepts Mission -> Leg 1 Turn-by-Turn Navigation (Unit -> Scene)
  const acceptMission = useCallback(async (unitId: string) => {
    const unit = fleet.find(u => u.id === unitId);
    if (!unit || !unit.currentIncidentId) return;

    const incident = incidents.find(i => i.id === unit.currentIncidentId);
    if (!incident) return;

    // Calculate real turn-by-turn route to scene (Leg 1)
    const route = await calculateTurnByTurnRoute(
      [unit.lat, unit.lng],
      [incident.lat, incident.lng],
      `Scene (${incident.address.split(',')[0]})`
    );

    const nextIncidents = incidents.map(inc => {
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
              text: `${unit.callsign} accepted mission and is navigating to scene`,
              actor: 'Responder' as const
            }
          ]
        };
      }
      return inc;
    });

    const nextFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          status: 'en_route' as const,
          speedKmh: 58,
          routeCoords: route.coordinates,
          routeIndex: 0,
          navigationSteps: route.steps,
          currentStepIndex: 0
        };
      }
      return u;
    });

    setIncidents(nextIncidents);
    setFleet(nextFleet);
    broadcastAll(nextIncidents, nextFleet, hospitals);
    sound.playTactileClick();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('incidents').update({ status: 'en_route', updated_at: new Date().toISOString() }).eq('id', incident.id);
        await supabase.from('units').update({ status: 'en_route', updated_at: new Date().toISOString() }).eq('id', unitId);
      } catch (err) {
        console.error('Supabase accept mission error:', err);
      }
    }
  }, [fleet, incidents, hospitals, broadcastAll]);

  // 6. Responder Marks Arrived On Scene
  const markArrivedOnScene = useCallback(async (unitId: string) => {
    const unit = fleet.find(u => u.id === unitId);
    if (!unit || !unit.currentIncidentId) return;

    const incident = incidents.find(i => i.id === unit.currentIncidentId);
    if (!incident) return;

    const nextIncidents = incidents.map(inc => {
      if (inc.id === unit.currentIncidentId) {
        return {
          ...inc,
          status: 'on_scene' as const,
          etaSeconds: 0,
          updatedAt: Date.now(),
          patientVitals: {
            condition: "Acute Triage & Trauma Assessment",
            severity: inc.severity || ("CRITICAL" as const),
            bloodPressure: "148/92",
            heartRate: 110,
            oxygenSat: 94,
            notes: "Vitals stabilized. Oxygen administered."
          },
          timeline: [
            ...inc.timeline,
            {
              id: `tl-${Date.now()}`,
              time: Date.now(),
              status: 'on_scene' as const,
              text: `${unit.callsign} arrived on scene. First responders assessing patient.`,
              actor: 'Responder' as const
            }
          ]
        };
      }
      return inc;
    });

    const nextFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          status: 'on_scene' as const,
          speedKmh: 0,
          lat: incident.lat,
          lng: incident.lng,
          routeCoords: undefined,
          routeIndex: 0,
          navigationSteps: undefined,
          currentStepIndex: 0
        };
      }
      return u;
    });

    setIncidents(nextIncidents);
    setFleet(nextFleet);
    broadcastAll(nextIncidents, nextFleet, hospitals);
    sound.playTactileClick();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('incidents').update({ status: 'on_scene', updated_at: new Date().toISOString() }).eq('id', incident.id);
        await supabase.from('units').update({ status: 'on_scene', lat: incident.lat, lng: incident.lng, updated_at: new Date().toISOString() }).eq('id', unitId);
      } catch (err) {
        console.error('Supabase on scene error:', err);
      }
    }
  }, [fleet, incidents, hospitals, broadcastAll]);

  // 7. Responder Starts Hospital Transport -> Leg 2 Turn-by-Turn Navigation (Scene -> Auto-Assigned Hospital)
  const startHospitalTransport = useCallback(async (unitId: string, customVitals?: PatientVitals) => {
    const unit = fleet.find(u => u.id === unitId);
    if (!unit || !unit.currentIncidentId) return;

    const incident = incidents.find(i => i.id === unit.currentIncidentId);
    if (!incident) return;

    // Use auto-assigned hospital
    const targetHospId = incident.assignedHospitalId || unit.assignedHospitalId;
    let hospital = hospitals.find(h => h.id === targetHospId && h.status === 'accepting');
    if (!hospital) {
      // Re-evaluate best accepting hospital if assigned one went full
      hospital = findBestHospital(incident.type, incident.severity, unit.lat, unit.lng, hospitals) || hospitals[0];
    }

    // Calculate Leg 2 turn-by-turn route to hospital
    const route = await calculateTurnByTurnRoute(
      [unit.lat, unit.lng],
      [hospital.lat, hospital.lng],
      hospital.name
    );

    const vitals = customVitals || incident.patientVitals || {
      condition: "Cardiac Patient - High Priority",
      severity: incident.severity || ("CRITICAL" as const),
      bloodPressure: "145/90",
      heartRate: 104,
      oxygenSat: 95,
      notes: "In transit to Emergency ICU Trauma Bay."
    };

    const nextIncidents = incidents.map(inc => {
      if (inc.id === unit.currentIncidentId) {
        return {
          ...inc,
          status: 'transporting' as const,
          assignedHospitalId: hospital.id,
          distanceKm: parseFloat((route.distanceMeters / 1000).toFixed(2)),
          etaSeconds: route.durationSeconds,
          patientVitals: vitals,
          updatedAt: Date.now(),
          timeline: [
            ...inc.timeline,
            {
              id: `tl-${Date.now()}`,
              time: Date.now(),
              status: 'transporting' as const,
              text: `Transporting to ${hospital.name}. Live inbound alert broadcast to ER Trauma Team.`,
              actor: 'Responder' as const
            }
          ]
        };
      }
      return inc;
    });

    const nextFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          status: 'transporting' as const,
          assignedHospitalId: hospital.id,
          speedKmh: 64,
          routeCoords: route.coordinates,
          routeIndex: 0,
          navigationSteps: route.steps,
          currentStepIndex: 0
        };
      }
      return u;
    });

    setIncidents(nextIncidents);
    setFleet(nextFleet);
    broadcastAll(nextIncidents, nextFleet, hospitals);
    sound.playHospitalChime();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('incidents').update({
          status: 'transporting',
          assigned_hospital_id: hospital.id,
          eta_seconds: route.durationSeconds,
          distance_km: parseFloat((route.distanceMeters / 1000).toFixed(2)),
          updated_at: new Date().toISOString()
        }).eq('id', incident.id);

        await supabase.from('units').update({
          status: 'transporting',
          updated_at: new Date().toISOString()
        }).eq('id', unitId);
      } catch (err) {
        console.error('Supabase start transport error:', err);
      }
    }
  }, [fleet, hospitals, incidents, broadcastAll]);

  // 8. Responder Arrives at Hospital Trauma Bay
  const markArrivedAtHospital = useCallback(async (unitId: string) => {
    const unit = fleet.find(u => u.id === unitId);
    if (!unit || !unit.currentIncidentId || !unit.assignedHospitalId) return;

    const hospital = hospitals.find(h => h.id === unit.assignedHospitalId);
    if (!hospital) return;

    const nextIncidents = incidents.map(inc => {
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
              text: `${unit.callsign} reached ${hospital.name} Trauma Bay. Handing off patient.`,
              actor: 'Responder' as const
            }
          ]
        };
      }
      return inc;
    });

    const nextFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          speedKmh: 0,
          lat: hospital.lat,
          lng: hospital.lng,
          routeCoords: undefined,
          routeIndex: 0,
          navigationSteps: undefined,
          currentStepIndex: 0
        };
      }
      return u;
    });

    setIncidents(nextIncidents);
    setFleet(nextFleet);
    broadcastAll(nextIncidents, nextFleet, hospitals);
    sound.playHospitalChime();
  }, [fleet, hospitals, incidents, broadcastAll]);

  // 9. Hospital Toggles ER Capacity
  const toggleHospitalCapacity = useCallback(async (hospitalId: string) => {
    const nextHospitals = hospitals.map(h => {
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

    setHospitals(nextHospitals);
    broadcastAll(incidents, fleet, nextHospitals);
    sound.playTactileClick();

    if (isSupabaseConfigured) {
      const target = nextHospitals.find(h => h.id === hospitalId);
      if (target) {
        try {
          await supabase.from('hospitals').update({
            status: target.status,
            occupied_beds: target.occupiedBeds,
            updated_at: new Date().toISOString()
          }).eq('id', hospitalId);
        } catch (err) {
          console.error('Supabase hospital status update error:', err);
        }
      }
    }
  }, [hospitals, incidents, fleet, broadcastAll]);

  // 10. Hospital Receives Patient & Closes Loop
  const receivePatientAdmit = useCallback(async (hospitalId: string, incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId);
    const assignedUnitId = incident?.assignedUnitId;

    const nextIncidents = incidents.map(inc => {
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
              text: `Patient admitted to Emergency Care. Incident loop closed.`,
              actor: 'Hospital' as const
            }
          ]
        };
      }
      return inc;
    });

    // Free responder unit back to available at hospital position
    const nextFleet = fleet.map(u => {
      if (u.id === assignedUnitId) {
        return {
          ...u,
          status: 'available' as const,
          currentIncidentId: undefined,
          assignedHospitalId: undefined,
          speedKmh: 0,
          routeCoords: undefined,
          routeIndex: 0,
          navigationSteps: undefined,
          currentStepIndex: 0
        };
      }
      return u;
    });

    const nextHospitals = hospitals.map(h => {
      if (h.id === hospitalId) {
        return {
          ...h,
          occupiedBeds: Math.min(h.totalBeds, h.occupiedBeds + 1),
          icuBedsAvailable: Math.max(0, h.icuBedsAvailable - 1)
        };
      }
      return h;
    });

    setIncidents(nextIncidents);
    setFleet(nextFleet);
    setHospitals(nextHospitals);
    broadcastAll(nextIncidents, nextFleet, nextHospitals);
    sound.playSuccessChime();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('incidents').update({ status: 'resolved', updated_at: new Date().toISOString() }).eq('id', incidentId);
        if (assignedUnitId) {
          await supabase.from('units').update({ status: 'available', updated_at: new Date().toISOString() }).eq('id', assignedUnitId);
        }
      } catch (err) {
        console.error('Supabase admit error:', err);
      }
    }
  }, [incidents, fleet, hospitals, broadcastAll]);

  // Toggle Responder Duty Status
  const toggleDutyStatus = useCallback(async (unitId: string) => {
    const nextFleet = fleet.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          status: u.status === 'offline' ? ('available' as const) : ('offline' as const)
        };
      }
      return u;
    });

    setFleet(nextFleet);
    broadcastAll(incidents, nextFleet, hospitals);
    sound.playTactileClick();

    if (isSupabaseConfigured) {
      const u = nextFleet.find(x => x.id === unitId);
      if (u) {
        try {
          await supabase.from('units').update({ status: u.status, updated_at: new Date().toISOString() }).eq('id', unitId);
        } catch (err) {
          console.error('Supabase duty toggle error:', err);
        }
      }
    }
  }, [fleet, incidents, hospitals, broadcastAll]);

  // Simulation loop for smooth vehicle movement along route
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

              // Step progression
              const steps = unit.navigationSteps;
              let stepIdx = unit.currentStepIndex || 0;
              if (steps && steps.length > 0 && nextIndex % 7 === 0 && stepIdx < steps.length - 1) {
                stepIdx += 1;
              }

              return {
                ...unit,
                lat: nextLat,
                lng: nextLng,
                heading,
                routeIndex: nextIndex,
                currentStepIndex: stepIdx
              };
            }
          }
          return unit;
        });
        return hasChanges ? nextFleet : prevFleet;
      });

      // Decrement ETA
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

  // Reset Simulation Data
  const resetData = useCallback(async () => {
    setIncidents([]);
    setFleet(INITIAL_FLEET);
    setHospitals(INITIAL_HOSPITALS);
    setActiveCitizenIncidentId(null);
    localStorage.removeItem('resqnet_active_citizen_inc_id');
    localStorage.removeItem('resqnet_incidents_v2');
    localStorage.removeItem('resqnet_fleet_v2');
    localStorage.removeItem('resqnet_hospitals_v2');
    broadcastAll([], INITIAL_FLEET, INITIAL_HOSPITALS);
    sound.playTactileClick();
  }, [broadcastAll]);

  return (
    <EmergencyContext.Provider
      value={{
        incidents,
        fleet,
        hospitals,
        activeCitizenIncident,
        isMuted,
        toggleMute,
        triggerCitizenSos,
        updateCitizenIncidentDetails,
        cancelCitizenSos,
        assignResponderToIncident,
        overrideAssignedHospital,
        acceptMission,
        markArrivedOnScene,
        startHospitalTransport,
        markArrivedAtHospital,
        toggleDutyStatus,
        toggleHospitalCapacity,
        receivePatientAdmit,
        resetData
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
