const supabase = require('../supabase');

const EARTH_RADIUS_M = 6371000;

/**
 * Haversine distance in meters between two lat/lng points
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find nearest active location that contains the given coordinates
 * @returns {{ location, distance } | null}
 */
async function findMatchingLocation(lat, lng) {
  const { data: locations, error } = await supabase
    .from('checkin_locations')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;

  let nearest = null;
  let minDist = Infinity;

  for (const loc of locations) {
    const dist = haversineDistance(lat, lng, loc.latitude, loc.longitude);
    if (dist <= loc.radius_meters && dist < minDist) {
      minDist = dist;
      nearest = { location: loc, distance: Math.round(dist) };
    }
  }

  return nearest;
}

module.exports = { findMatchingLocation, haversineDistance };
