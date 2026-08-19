export type EmergencyType = 'medical' | 'fire' | 'police';

export type IncidentStatus = 
  | 'pending'        // Just created by citizen, waiting for dispatch
  | 'assigned'       // Dispatch assigned responder, awaiting responder accept
  | 'en_route'       // Responder accepted, driving to citizen
  | 'on_scene'       // Responder reached citizen / scene
  | 'transporting'   // Patient secured, driving to selected hospital
  | 'resolved'       // Hospital received patient / Incident closed
  | 'cancelled';     // Citizen cancelled false alarm

export interface PatientVitals {
  condition: string;
  severity: 'CRITICAL' | 'SERIOUS' | 'STABLE';
  bloodPressure?: string;
  heartRate?: number;
  oxygenSat?: number;
  notes?: string;
}

export interface IncidentTimelineEvent {
  id: string;
  time: number;
  status: IncidentStatus;
  text: string;
  actor: 'Citizen' | 'Dispatch' | 'Responder' | 'Hospital' | 'System';
}

export interface Incident {
  id: string;
  type: EmergencyType;
  title: string;
  description: string;
  status: IncidentStatus;
  lat: number;
  lng: number;
  address: string;
  createdAt: number;
  updatedAt: number;
  assignedUnitId?: string;
  targetHospitalId?: string;
  patientVitals?: PatientVitals;
  etaSeconds: number;
  distanceKm: number;
  timeline: IncidentTimelineEvent[];
  isDemoIncident?: boolean;
}

export type ResponderType = 'ambulance' | 'firetruck' | 'police_cruiser';

export type ResponderStatus = 
  | 'available' 
  | 'dispatched' 
  | 'en_route' 
  | 'on_scene' 
  | 'transporting' 
  | 'offline';

export interface ResponderUnit {
  id: string;
  callsign: string;
  type: ResponderType;
  status: ResponderStatus;
  badgeId: string;
  pin: string;
  driverName: string;
  lat: number;
  lng: number;
  heading: number; // 0-360 deg
  speedKmh: number;
  batteryPercent: number;
  crew: string[];
  currentIncidentId?: string;
  targetHospitalId?: string;
  routeCoords?: [number, number][];
  routeIndex?: number;
}

export interface Hospital {
  id: string;
  name: string;
  shortCode: string;
  status: 'accepting' | 'full';
  totalBeds: number;
  occupiedBeds: number;
  icuBedsAvailable: number;
  specializations: string[];
  lat: number;
  lng: number;
  address: string;
  phone: string;
}

export type PortalView = 
  | 'pitch_grid' 
  | 'public' 
  | 'dispatch' 
  | 'responder' 
  | 'hospital';

export interface CityLocation {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}
