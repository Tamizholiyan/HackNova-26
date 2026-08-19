import type { NavigationStep } from '../types';
import { generateRoutePoints } from './mockData';

export interface RouteResult {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  steps: NavigationStep[];
}

// Fetch real turn-by-turn route using OSRM with graceful offline fallback
export async function calculateTurnByTurnRoute(
  start: [number, number], // [lat, lng]
  end: [number, number],   // [lat, lng]
  destinationName: string = 'Destination'
): Promise<RouteResult> {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM returns GeoJSON coordinates as [lng, lat]
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        const steps: NavigationStep[] = [];
        if (route.legs && route.legs.length > 0) {
          route.legs[0].steps.forEach((s: { maneuver?: { type?: string; modifier?: string }; distance?: number; duration?: number; name?: string }) => {
            const maneuverType = s.maneuver?.type || 'continue';
            const modifier = s.maneuver?.modifier || '';
            const street = s.name || 'Main Road';

            let type: NavigationStep['type'] = 'continue';
            if (maneuverType.includes('depart')) type = 'depart';
            else if (maneuverType.includes('arrive')) type = 'arrive';
            else if (modifier.includes('left')) type = 'turn-left';
            else if (modifier.includes('right')) type = 'turn-right';
            else if (modifier.includes('roundabout')) type = 'roundabout';

            let instruction = `Continue on ${street}`;
            if (type === 'depart') instruction = `Depart toward ${street}`;
            else if (type === 'arrive') instruction = `Arrive at ${destinationName}`;
            else if (type === 'turn-left') instruction = `Turn left onto ${street}`;
            else if (type === 'turn-right') instruction = `Turn right onto ${street}`;

            steps.push({
              instruction,
              distanceMeters: Math.round(s.distance || 200),
              durationSeconds: Math.round(s.duration || 30),
              type,
              streetName: street
            });
          });
        }

        if (steps.length === 0) {
          steps.push(
            { instruction: `Proceed toward ${destinationName}`, distanceMeters: Math.round(route.distance * 0.5), durationSeconds: Math.round(route.duration * 0.5), type: 'depart' },
            { instruction: `Arrive at ${destinationName}`, distanceMeters: Math.round(route.distance * 0.5), durationSeconds: Math.round(route.duration * 0.5), type: 'arrive' }
          );
        }

        return {
          coordinates,
          distanceMeters: Math.round(route.distance),
          durationSeconds: Math.round(route.duration),
          steps
        };
      }
    }
  } catch {
    // Network / timeout / rate-limit fallback
  }

  // Realistic Fallback Waypoint and Navigation Generator
  const coords = generateRoutePoints(start, end, 30);
  const dLat = Math.abs(endLat - startLat);
  const dLng = Math.abs(endLng - startLng);
  const approxDistKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
  const distMeters = Math.round(approxDistKm * 1000);
  const durSec = Math.round((approxDistKm / 45) * 3600); // 45km/h speed

  const fallbackSteps: NavigationStep[] = [
    {
      instruction: `Depart emergency station via Arterial Route`,
      distanceMeters: Math.round(distMeters * 0.2),
      durationSeconds: Math.round(durSec * 0.2),
      type: 'depart',
      streetName: 'Kamarajar Salai'
    },
    {
      instruction: `Turn right onto Express Transit Corridor`,
      distanceMeters: Math.round(distMeters * 0.35),
      durationSeconds: Math.round(durSec * 0.35),
      type: 'turn-right',
      streetName: 'Anna Salai Expressway'
    },
    {
      instruction: `Turn left onto Emergency Access Way`,
      distanceMeters: Math.round(distMeters * 0.3),
      durationSeconds: Math.round(durSec * 0.3),
      type: 'turn-left',
      streetName: 'Greams Road'
    },
    {
      instruction: `Arrive at ${destinationName}`,
      distanceMeters: Math.round(distMeters * 0.15),
      durationSeconds: Math.round(durSec * 0.15),
      type: 'arrive',
      streetName: 'Trauma Receiving Bay'
    }
  ];

  return {
    coordinates: coords,
    distanceMeters: distMeters,
    durationSeconds: durSec,
    steps: fallbackSteps
  };
}
