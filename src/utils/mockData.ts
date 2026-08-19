import type { Hospital, ResponderUnit } from '../types';

export const MARINA_BEACH_COORDS: { lat: number; lng: number; address: string } = {
  lat: 13.0500,
  lng: 80.2824,
  address: "Marina Beach Promenade, Near Light House, Chennai",
};

export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: "hosp-1",
    name: "Rajiv Gandhi Govt General Hospital (Hospital A)",
    shortCode: "RGGGH-A",
    status: "full", // Initially full to showcase smart capacity diversion
    totalBeds: 350,
    occupiedBeds: 350,
    icuBedsAvailable: 0,
    specializations: ["Level 1 Trauma", "General Emergency", "Toxicology"],
    lat: 13.0805,
    lng: 80.2778,
    address: "EVR Periyar Salai, Park Town, Chennai",
    phone: "+91 44 2530 5000",
  },
  {
    id: "hosp-2",
    name: "Apollo Main Hospital (Hospital B)",
    shortCode: "APOLLO-B",
    status: "accepting",
    totalBeds: 220,
    occupiedBeds: 168,
    icuBedsAvailable: 14,
    specializations: ["Advanced Cardiac Care", "Neuro Trauma", "ICU Resuscitation"],
    lat: 13.0602,
    lng: 80.2514,
    address: "21 Greams Lane, Off Greams Road, Thousand Lights, Chennai",
    phone: "+91 44 2829 0200",
  },
  {
    id: "hosp-3",
    name: "Fortis Malar Hospital (Hospital C)",
    shortCode: "FORTIS-C",
    status: "accepting",
    totalBeds: 180,
    occupiedBeds: 142,
    icuBedsAvailable: 8,
    specializations: ["Cardiology", "Critical Care", "Organ Transplant"],
    lat: 13.0068,
    lng: 80.2575,
    address: "No. 52, 1st Main Rd, Gandhi Nagar, Adyar, Chennai",
    phone: "+91 44 4289 2222",
  },
  {
    id: "hosp-4",
    name: "Govt Royapettah Hospital",
    shortCode: "GRH-D",
    status: "accepting",
    totalBeds: 260,
    occupiedBeds: 215,
    icuBedsAvailable: 9,
    specializations: ["Accident & Emergency", "Burn Unit", "Orthopedics"],
    lat: 13.0536,
    lng: 80.2642,
    address: "Westcott Rd, Royapettah, Chennai",
    phone: "+91 44 2848 1111",
  }
];

export const INITIAL_FLEET: ResponderUnit[] = [
  {
    id: "unit-1",
    callsign: "Ambulance Alpha-1",
    type: "ambulance",
    status: "available",
    badgeId: "PARAMEDIC-01",
    pin: "1234",
    driverName: "Dr. Priya Raman & Paramedic Vignesh",
    lat: 13.0542,
    lng: 80.2735, // ~1.1 km from Marina Beach
    heading: 135,
    speedKmh: 0,
    batteryPercent: 94,
    crew: ["Dr. Priya Raman (Senior Paramedic)", "Vignesh K. (EMT-Advanced)"],
  },
  {
    id: "unit-2",
    callsign: "Ambulance Bravo-2",
    type: "ambulance",
    status: "available",
    badgeId: "PARAMEDIC-02",
    pin: "5678",
    driverName: "Anand S. & Deepa M.",
    lat: 13.0370,
    lng: 80.2680, // Mylapore area (~2.2 km)
    heading: 45,
    speedKmh: 0,
    batteryPercent: 88,
    crew: ["Anand S. (EMT)", "Deepa M. (Triage Specialist)"],
  },
  {
    id: "unit-3",
    callsign: "Fire Rescue Squad-9",
    type: "firetruck",
    status: "available",
    badgeId: "FIRE-09",
    pin: "9999",
    driverName: "Capt. Ramesh & Squad",
    lat: 13.0580,
    lng: 80.2710, // Triplicane Station
    heading: 90,
    speedKmh: 0,
    batteryPercent: 98,
    crew: ["Capt. Ramesh (Lead)", "Selvam P. (Rescue Spec.)", "Mani R. (Operator)"],
  },
  {
    id: "unit-4",
    callsign: "Police Patrol Cruiser-7",
    type: "police_cruiser",
    status: "available",
    badgeId: "POLICE-07",
    pin: "7777",
    driverName: "Insp. Karthik & Suresh",
    lat: 13.0460,
    lng: 80.2805, // Marina Loop Rd
    heading: 270,
    speedKmh: 0,
    batteryPercent: 91,
    crew: ["Insp. Karthik (Duty Officer)", "Constable Suresh"],
  },
  {
    id: "unit-5",
    callsign: "Ambulance Echo-5",
    type: "ambulance",
    status: "available",
    badgeId: "PARAMEDIC-05",
    pin: "5555",
    driverName: "Arun K. & Stella R.",
    lat: 13.0720,
    lng: 80.2580, // Nungambakkam
    heading: 180,
    speedKmh: 0,
    batteryPercent: 82,
    crew: ["Arun K. (EMT)", "Stella R. (Nurse Practitioner)"],
  }
];

// Calculate distance in km (Haversine formula)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// Generate realistic intermediate waypoints for smooth vehicle simulation
export function generateRoutePoints(start: [number, number], end: [number, number], steps: number = 20): [number, number][] {
  const points: [number, number][] = [];
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  const midLat = startLat + (endLat - startLat) * 0.45;
  const midLng = startLng + (endLng - startLng) * 0.55;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let lat: number;
    let lng: number;

    if (t < 0.5) {
      const segT = t / 0.5;
      lat = startLat + (midLat - startLat) * segT;
      lng = startLng + (midLng - startLng) * segT;
    } else {
      const segT = (t - 0.5) / 0.5;
      lat = midLat + (endLat - midLat) * segT;
      lng = midLng + (endLng - midLng) * segT;
    }
    points.push([lat, lng]);
  }
  return points;
}
