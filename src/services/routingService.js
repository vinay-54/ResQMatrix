/**
 * OSRM Public Routing Engine
 * Uses the open OSRM demo server for demonstration.
 * In production, self-host OSRM or use a paid routing API.
 *
 * SAFETY NOTE: OSRM uses standard road network data.
 * It does NOT know about flooded roads, blocked areas, or
 * disaster conditions. Routes must NEVER be presented as verified safe.
 */

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export const ROUTE_STATUS = {
  IDLE:     'idle',
  LOADING:  'loading',
  SUCCESS:  'success',
  ERROR:    'error',
  NO_LOCATION: 'no_location',
};

export const calculateRoute = async (origin, destination) => {
  if (!origin || !destination) {
    return { status: ROUTE_STATUS.NO_LOCATION, error: 'Origin or destination missing.' };
  }

  const url = `${OSRM_BASE}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
              `?overview=full&geometries=geojson&steps=false`;

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Routing server returned ${res.status}`);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      return { status: ROUTE_STATUS.ERROR, error: 'No route found between these locations.' };
    }

    const route    = data.routes[0];
    const distance = route.distance;  // metres
    const duration = route.duration;  // seconds
    const geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]); // Leaflet [lat,lng]

    return {
      status: ROUTE_STATUS.SUCCESS,
      geometry,
      distanceM:  distance,
      distanceKm: (distance / 1000).toFixed(2),
      durationMin: Math.ceil(duration / 60),
      // Safety warning is ALWAYS included — never omitted
      safetyWarning: 'UNVERIFIED ROUTE — This route is based on standard road data only. ' +
        'It does NOT account for flooded roads, blocked areas, or current disaster conditions. ' +
        'Confirm safety with field teams before proceeding.',
      safetyVerified: false, // Always false — we cannot verify route safety
    };
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return { status: ROUTE_STATUS.ERROR, error: 'Routing server timed out. Check your connection.' };
    }
    return { status: ROUTE_STATUS.ERROR, error: `Routing failed: ${err.message}` };
  }
};

export const formatDistance = (km) => {
  if (parseFloat(km) < 1) return `${Math.round(parseFloat(km) * 1000)} m`;
  return `${km} km`;
};

export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
