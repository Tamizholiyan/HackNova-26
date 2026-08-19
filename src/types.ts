export type EmergencyType = 'medical' | 'fire' | 'police';

export type IncidentSeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';

export type IncidentStatus = 
  | 'pending'        // Created by citizen, waiting for dispatch
  | 'assigned'       // Dispatch assigned responder
  | 'en_route'       // Responder accepted, navigating to scene
  | 'on_scene'       // Responder reached scene / patient
  | 'transporting'   // Patient secured, navigating to auto-assigned hospital
  | 'resolved'       // Hospital admitted patient / Incident closed
  | 'cancelled';     // Citizen cancelled false alarm

export interface PatientVitals {
  condition: string;
  severity: IncidentSeverity;
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

export interface NavigationStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  type: 'turn-left' | 'turn-right' | 'continue' | 'arrive' | 'depart' | 'roundabout';
  streetName?: string;
}

export interface Incident {
  id: string;
  type: EmergencyType;
  title: string;
  description?: string;
  severity?: IncidentSeverity;
  status: IncidentStatus;
  lat: number;
  lng: number;
  address: string;
  createdAt: number;
  updatedAt: number;
  citizenToken?: string;
  assignedUnitId?: string;
  assignedHospitalId?: string;
  patientVitals?: PatientVitals;
  etaSeconds: number;
  distanceKm: number;
  timeline: IncidentTimelineEvent[];
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
  pin?: string;
  driverName: string;
  lat: number;
  lng: number;
  heading: number; // 0-360 deg
  speedKmh: number;
  batteryPercent: number;
  crew: string[];
  currentIncidentId?: string;
  assignedHospitalId?: string;
  routeCoords?: [number, number][];
  routeIndex?: number;
  navigationSteps?: NavigationStep[];
  currentStepIndex?: number;
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

export type UserRole = 'dispatcher' | 'responder' | 'hospital';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  unitId?: string;
  hospitalId?: string;
}
