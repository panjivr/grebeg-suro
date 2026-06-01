/**
 * Haversine distance between two lat/long points, in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface GeoValidationResult {
  valid: boolean;
  distance: number; // meters from event center
  radius: number;
}

export function validateLocation(
  userLat: number,
  userLong: number,
  eventLat: number,
  eventLong: number,
  radiusMeter: number
): GeoValidationResult {
  const distance = haversineDistance(userLat, userLong, eventLat, eventLong);
  return {
    valid: distance <= radiusMeter,
    distance: Math.round(distance),
    radius: radiusMeter,
  };
}
